import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { generateEstimatePDF, generateEstimatePDFLegacy } from '$lib/server/pdf.js';
import { assembleInteriorEstimate, assembleExteriorEstimate } from '$lib/server/estimate-templates.js';
import { createEstimateDoc } from '$lib/server/google-docs.js';
import { writeFileSync, mkdirSync } from 'fs';
import type { RequestHandler } from './$types.js';
import type { InteriorScopeData, ExteriorScopeData } from '$lib/types/index.js';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw error(400, 'Tenant not found');

  const sub = db.select().from(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .get();
  if (!sub) throw error(404, 'Submission not found');

  const body = await request.json();
  const adjustedPrice = body.adjusted_price as number | null;

  const scope = sub.scope_json ? JSON.parse(sub.scope_json) : null;
  const quote = sub.quote_json ? JSON.parse(sub.quote_json) : null;
  if (!scope || !quote) throw error(400, 'Missing scope or quote data');

  // Save previous version before overwriting
  const currentVersion = sub.version || 1;
  const previousVersions: { version: number; quote_json: string; sales_price: number | null; date: string }[] =
    sub.previous_versions_json ? JSON.parse(sub.previous_versions_json) : [];

  previousVersions.push({
    version: currentVersion,
    quote_json: sub.quote_json || '',
    sales_price: sub.sales_price,
    date: new Date().toISOString(),
  });

  // Override grand total if adjusted
  if (adjustedPrice && adjustedPrice !== quote.grand_total) {
    quote.grand_total = adjustedPrice;
  }

  db.update(submissions).set({
    sales_price: adjustedPrice || quote.grand_total,
    quote_json: JSON.stringify(quote),
    version: currentVersion + 1,
    previous_versions_json: JSON.stringify(previousVersions),
    updated_at: new Date().toISOString(),
  }).where(eq(submissions.id, params.id)).run();

  const tenantInfo = {
    company_name: tenant.company_name,
    contact_phone: tenant.contact_phone,
    contact_email: tenant.contact_email,
    website_url: tenant.website_url,
  };

  let pdfUrl: string | null = null;
  let googleDocUrl: string | null = null;

  // Regenerate PDF
  try {
    let pdfBuffer: Buffer;
    if (sub.trade_type === 'interior') {
      const doc = assembleInteriorEstimate(scope as InteriorScopeData, quote, tenantInfo, params.id);
      pdfBuffer = await generateEstimatePDF(doc, tenant);
    } else if (sub.trade_type === 'exterior') {
      const doc = assembleExteriorEstimate(scope as ExteriorScopeData, quote, tenantInfo, params.id);
      pdfBuffer = await generateEstimatePDF(doc, tenant);
    } else {
      pdfBuffer = await generateEstimatePDFLegacy(scope.client, quote, params.id, tenant);
    }

    mkdirSync('./data/pdfs', { recursive: true });
    writeFileSync(`./data/pdfs/${params.id}.pdf`, pdfBuffer);
    pdfUrl = `/api/estimate-pdf/${params.id}?t=${Date.now()}`;
    db.update(submissions).set({ estimate_pdf_url: `/api/estimate-pdf/${params.id}`, updated_at: new Date().toISOString() })
      .where(eq(submissions.id, params.id)).run();
  } catch (err) {
    console.error('[regenerate] PDF failed:', err);
  }

  // Regenerate Google Doc if connected
  if (tenant.google_refresh_token) {
    try {
      googleDocUrl = await createEstimateDoc(tenant, scope.client, quote, params.id);
      if (googleDocUrl) {
        db.update(submissions).set({ google_doc_url: googleDocUrl }).where(eq(submissions.id, params.id)).run();
      }
    } catch (err) {
      console.error('[regenerate] Google Doc failed:', err);
    }
  }

  return json({ success: true, pdf_url: pdfUrl, google_doc_url: googleDocUrl, quote });
};
