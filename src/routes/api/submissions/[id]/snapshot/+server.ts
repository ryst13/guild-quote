import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { assembleInteriorSnapshot, assembleExteriorSnapshot, assembleEpoxySnapshot } from '$lib/server/snapshot-templates.js';
import { generateSnapshotPDF } from '$lib/server/snapshot-pdf.js';
import { createSnapshotSheet } from '$lib/server/snapshot-sheets.js';
import { writeFileSync, mkdirSync } from 'fs';
import type { RequestHandler } from './$types.js';
import type { InteriorScopeData, ExteriorScopeData, EpoxyScopeData } from '$lib/types/index.js';
import type { SupportedLanguage } from '$lib/server/i18n.js';

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
  const lang = (body.lang as SupportedLanguage) || 'en';

  const scope = sub.scope_json ? JSON.parse(sub.scope_json) : null;
  const quote = sub.quote_json ? JSON.parse(sub.quote_json) : null;
  if (!scope || !quote) throw error(400, 'Missing scope or quote data');

  const tenantInfo = {
    company_name: tenant.company_name,
    contact_phone: tenant.contact_phone,
    contact_email: tenant.contact_email,
  };

  let snapshot;
  if (sub.trade_type === 'interior') {
    snapshot = assembleInteriorSnapshot(scope as InteriorScopeData, quote, tenantInfo, params.id, sub.estimator_notes || '', lang);
  } else if (sub.trade_type === 'exterior') {
    snapshot = assembleExteriorSnapshot(scope as ExteriorScopeData, quote, tenantInfo, params.id, sub.estimator_notes || '', lang);
  } else {
    snapshot = assembleEpoxySnapshot(scope as EpoxyScopeData, quote, tenantInfo, params.id, sub.estimator_notes || '', lang);
  }

  // Generate PDF
  let pdfUrl: string | null = null;
  try {
    const pdfBuffer = await generateSnapshotPDF(snapshot, tenant);
    mkdirSync('./data/pdfs', { recursive: true });
    const filename = `${params.id}-snapshot-${lang}.pdf`;
    writeFileSync(`./data/pdfs/${filename}`, pdfBuffer);
    pdfUrl = `/api/estimate-pdf/${filename}?t=${Date.now()}`;
    db.update(submissions).set({
      snapshot_pdf_url: `/api/estimate-pdf/${filename}`,
      updated_at: new Date().toISOString(),
    }).where(eq(submissions.id, params.id)).run();
  } catch (err) {
    console.error('[snapshot] PDF generation failed:', err);
  }

  // Generate Google Sheet snapshot (if Google connected)
  let snapshotDocUrl: string | null = null;
  if (tenant.google_refresh_token) {
    try {
      snapshotDocUrl = await createSnapshotSheet(tenant, snapshot);
      if (snapshotDocUrl) {
        db.update(submissions).set({
          snapshot_doc_url: snapshotDocUrl,
          updated_at: new Date().toISOString(),
        }).where(eq(submissions.id, params.id)).run();
      }
    } catch (err) {
      console.error('[snapshot] Google Sheet generation failed:', err);
    }
  }

  return json({ success: true, pdf_url: pdfUrl, snapshot_doc_url: snapshotDocUrl });
};
