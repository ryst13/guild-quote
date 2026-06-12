import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions, tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { calculateInteriorQuote, calculateExteriorQuote, calculateEpoxyQuote } from '$lib/server/pricing.js';
import { resolveSurcharges, resolveMaterials, resolvePaymentTerms } from '$lib/server/pricing-config.js';
import { calculateInteriorBottomUp, calculateExteriorBottomUp, calculateEpoxyBottomUp } from '$lib/server/pricing-v2.js';
import { generateEstimatePDF } from '$lib/server/pdf.js';
import { assembleInteriorEstimate, assembleExteriorEstimate, assembleEpoxyEstimate } from '$lib/server/estimate-templates.js';
import { createEstimateDoc } from '$lib/server/google-docs.js';
import { createEstimateSheet } from '$lib/server/google-sheets.js';
import { ensureFolderStructure, ensureProjectFolder } from '$lib/server/google-drive.js';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4 } from 'uuid';
import { getAccessState } from '$lib/server/features.js';
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

  // Plan enforcement — mirrors the billing page promises exactly
  const access = getAccessState(tenant);
  if (!access.canGenerate) {
    throw error(402, 'Your trial has ended. Choose a plan in Billing to keep creating estimates.');
  }
  // GQ ($49) is PDF output (with the tenant's branding); Docs/Sheets are Pro
  const googleAllowed = access.canUseGoogleDocs;
  const brandTenant = access.canUseWhiteLabel
    ? tenant
    : { ...tenant, primary_color: '#2563eb', logo_url: null };

  if (!trade_type || !scope) throw error(400, 'Missing trade_type or scope');

  // The scope forms cap at 16 rooms / 8 surfaces; hold the API to a generous
  // multiple so a hand-crafted request can't blow up PDF/Sheets rendering
  const itemCount = (scope.rooms?.length ?? 0) + (scope.surfaces?.length ?? 0) + (scope.floors?.length ?? 0);
  if (itemCount > 40) throw error(400, 'Too many rooms or surfaces in one estimate. Split the job into two estimates.');

  // Calculate quote — run both engines, use tenant's preferred mode
  let quote;
  let quoteV2;
  const multiplier = tenant.labor_price_multiplier;
  const useBottomUp = tenant.pricing_mode === 'bottom_up';
  const engineCfg = { surcharges: resolveSurcharges(tenant), materials: resolveMaterials(tenant) };

  switch (trade_type) {
    case 'interior': {
      const topDown = calculateInteriorQuote(scope as InteriorScopeData, tenant.catalog, multiplier, engineCfg);
      const bottomUp = calculateInteriorBottomUp(scope as InteriorScopeData, tenant.catalog, tenant);
      quote = useBottomUp ? bottomUp : topDown;
      quoteV2 = useBottomUp ? topDown : bottomUp;
      break;
    }
    case 'exterior': {
      const topDown = calculateExteriorQuote(scope as ExteriorScopeData, tenant.catalog, multiplier, engineCfg);
      const bottomUp = calculateExteriorBottomUp(scope as ExteriorScopeData, tenant.catalog, tenant);
      quote = useBottomUp ? bottomUp : topDown;
      quoteV2 = useBottomUp ? topDown : bottomUp;
      break;
    }
    case 'epoxy': {
      const topDown = calculateEpoxyQuote(scope as EpoxyScopeData, tenant.catalog, multiplier, engineCfg);
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

  // One assembled document drives every output format, all three trades
  const paymentTerms = resolvePaymentTerms(tenant);
  const estimateDoc = trade_type === 'interior'
    ? assembleInteriorEstimate(scope as InteriorScopeData, quote, tenantInfo, submissionId, paymentTerms)
    : trade_type === 'exterior'
      ? assembleExteriorEstimate(scope as ExteriorScopeData, quote, tenantInfo, submissionId, paymentTerms)
      : assembleEpoxyEstimate(scope as EpoxyScopeData, quote, tenantInfo, submissionId, paymentTerms);

  // "PDF Only" tenants asked for no Google files — honor it
  if (tenant.google_refresh_token && googleAllowed && tenant.output_format !== 'pdf') {
    try {
      // Same Drive folder structure regenerate uses, so files land in the
      // project folder from day one and Won/Lost moves work without a regen
      let projectFolderId: string | null = null;
      if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
        try {
          const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
          oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          const folders = await ensureFolderStructure(drive, tenant);
          projectFolderId = await ensureProjectFolder(drive, folders.activeId, client.address, submissionId);
        } catch (folderErr) {
          console.warn('[google-drive] Folder setup failed, creating file in default location:', folderErr);
        }
      }

      googleDocUrl = tenant.output_format === 'google_sheets'
        ? await createEstimateSheet(tenant, estimateDoc, projectFolderId)
        : await createEstimateDoc(tenant, client, quote, submissionId, projectFolderId, estimateDoc);

      if (googleDocUrl || projectFolderId) {
        db.update(submissions).set({
          ...(googleDocUrl ? { google_doc_url: googleDocUrl } : {}),
          ...(projectFolderId ? { google_drive_project_folder_id: projectFolderId } : {}),
        }).where(eq(submissions.id, submissionId)).run();
      }
    } catch (err) {
      console.error('[google] Failed to create estimate file:', err);
    }
  }

  // Generate professional PDF using template engine
  try {
    const pdfBuffer = await generateEstimatePDF(estimateDoc, brandTenant);

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
