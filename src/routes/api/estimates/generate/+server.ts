import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions, tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { calculateInteriorQuote, calculateExteriorQuote, calculateEpoxyQuote } from '$lib/server/pricing.js';
import { calculateInteriorBottomUp, calculateExteriorBottomUp, calculateEpoxyBottomUp } from '$lib/server/pricing-v2.js';
import { generateEstimatePDF, generateEstimatePDFLegacy } from '$lib/server/pdf.js';
import { assembleInteriorEstimate, assembleExteriorEstimate } from '$lib/server/estimate-templates.js';
import { createEstimateDoc } from '$lib/server/google-docs.js';
import { createEstimateSheet } from '$lib/server/google-sheets.js';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, mkdirSync } from 'fs';
import type { RequestHandler } from './$types.js';
import type { InteriorScopeData, ExteriorScopeData, EpoxyScopeData, TradeType } from '$lib/types/index.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw error(400, 'Tenant not found');

  const body = await request.json();
  const { trade_type, scope } = body as { trade_type: TradeType; scope: any };

  if (!trade_type || !scope) throw error(400, 'Missing trade_type or scope');

  // Calculate quote — run both engines, use tenant's preferred mode
  let quote;
  let quoteV2;
  const multiplier = tenant.labor_price_multiplier;
  const useBottomUp = tenant.pricing_mode === 'bottom_up';

  switch (trade_type) {
    case 'interior': {
      const topDown = calculateInteriorQuote(scope as InteriorScopeData, tenant.catalog, multiplier);
      const bottomUp = calculateInteriorBottomUp(scope as InteriorScopeData, tenant.catalog, tenant);
      quote = useBottomUp ? bottomUp : topDown;
      quoteV2 = useBottomUp ? topDown : bottomUp;
      break;
    }
    case 'exterior': {
      const topDown = calculateExteriorQuote(scope as ExteriorScopeData, tenant.catalog, multiplier);
      const bottomUp = calculateExteriorBottomUp(scope as ExteriorScopeData, tenant.catalog, tenant);
      quote = useBottomUp ? bottomUp : topDown;
      quoteV2 = useBottomUp ? topDown : bottomUp;
      break;
    }
    case 'epoxy': {
      const topDown = calculateEpoxyQuote(scope as EpoxyScopeData, tenant.catalog, multiplier);
      const bottomUp = calculateEpoxyBottomUp(scope as EpoxyScopeData, tenant.catalog, tenant);
      quote = useBottomUp ? bottomUp : topDown;
      quoteV2 = useBottomUp ? topDown : bottomUp;
      break;
    }
    default:
      throw error(400, 'Invalid trade type');
  }

  // Log delta between engines for validation
  if (quoteV2) {
    const delta = Math.round(quote.grand_total - quoteV2.grand_total);
    const pctDelta = ((quote.grand_total - quoteV2.grand_total) / quoteV2.grand_total * 100).toFixed(1);
    console.log(`[pricing-v2] ${trade_type} | primary=$${Math.round(quote.grand_total)} alt=$${Math.round(quoteV2.grand_total)} delta=$${delta} (${pctDelta}%)`);
  }

  const client = scope.client;
  const submissionId = uuidv4();

  // Create submission record
  db.insert(submissions).values({
    id: submissionId,
    tenant_id: locals.user.tenant_id,
    user_id: locals.user.id,
    email: client.email || '',
    first_name: client.name?.split(' ')[0] || '',
    last_name: client.name?.split(' ').slice(1).join(' ') || '',
    phone: client.phone || null,
    address: client.address || '',
    form_data: JSON.stringify(body),
    scope_json: JSON.stringify(scope),
    quote_json: JSON.stringify(quote),
    sales_price: quote.grand_total,
    trade_type,
    estimate_status: 'draft',
    client_source: client.source || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).run();

  // Generate output
  let googleDocUrl: string | null = null;
  let pdfUrl: string | null = null;

  const tenantInfo = {
    company_name: tenant.company_name,
    contact_phone: tenant.contact_phone,
    contact_email: tenant.contact_email,
    website_url: tenant.website_url,
  };

  if (tenant.google_refresh_token && (trade_type === 'interior' || trade_type === 'exterior')) {
    // Use template engine for interior/exterior
    const estimateDoc = trade_type === 'interior'
      ? assembleInteriorEstimate(scope as InteriorScopeData, quote, tenantInfo, submissionId)
      : assembleExteriorEstimate(scope as ExteriorScopeData, quote, tenantInfo, submissionId);

    if (tenant.output_format === 'google_sheets') {
      try {
        googleDocUrl = await createEstimateSheet(tenant, estimateDoc);
        if (googleDocUrl) {
          db.update(submissions).set({ google_doc_url: googleDocUrl }).where(eq(submissions.id, submissionId)).run();
        }
      } catch (err) {
        console.error('[google-sheets] Failed to create sheet:', err);
      }
    } else {
      // Default: google_docs
      try {
        googleDocUrl = await createEstimateDoc(tenant, client, quote, submissionId);
        if (googleDocUrl) {
          db.update(submissions).set({ google_doc_url: googleDocUrl }).where(eq(submissions.id, submissionId)).run();
        }
      } catch (err) {
        console.error('[google-docs] Failed to create doc:', err);
      }
    }
  } else if (tenant.google_refresh_token) {
    // Epoxy — use legacy Google Docs for now
    try {
      googleDocUrl = await createEstimateDoc(tenant, client, quote, submissionId);
      if (googleDocUrl) {
        db.update(submissions).set({ google_doc_url: googleDocUrl }).where(eq(submissions.id, submissionId)).run();
      }
    } catch (err) {
      console.error('[google-docs] Failed to create doc:', err);
    }
  }

  // Generate professional PDF using template engine
  try {
    let pdfBuffer: Buffer;

    if (trade_type === 'interior') {
      const estimateDoc = assembleInteriorEstimate(scope as InteriorScopeData, quote, tenantInfo, submissionId);
      pdfBuffer = await generateEstimatePDF(estimateDoc, tenant);
    } else if (trade_type === 'exterior') {
      const estimateDoc = assembleExteriorEstimate(scope as ExteriorScopeData, quote, tenantInfo, submissionId);
      pdfBuffer = await generateEstimatePDF(estimateDoc, tenant);
    } else {
      // Epoxy uses legacy format for now
      pdfBuffer = await generateEstimatePDFLegacy(client, quote, submissionId, tenant);
    }

    mkdirSync('./data/pdfs', { recursive: true });
    const pdfPath = `./data/pdfs/${submissionId}.pdf`;
    writeFileSync(pdfPath, pdfBuffer);
    pdfUrl = `/api/estimate-pdf/${submissionId}`;
    db.update(submissions).set({ estimate_pdf_url: pdfUrl }).where(eq(submissions.id, submissionId)).run();
  } catch (err) {
    console.error('[pdf] Failed to generate PDF:', err);
  }

  return json({
    success: true,
    submission_id: submissionId,
    quote,
    google_doc_url: googleDocUrl,
    pdf_url: pdfUrl,
  });
};
