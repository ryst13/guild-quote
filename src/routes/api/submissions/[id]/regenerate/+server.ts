import { json, error } from '@sveltejs/kit';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { generateEstimatePDF, generateEstimatePDFLegacy } from '$lib/server/pdf.js';
import { assembleInteriorEstimate, assembleExteriorEstimate } from '$lib/server/estimate-templates.js';
import { createEstimateDoc } from '$lib/server/google-docs.js';
import { createEstimateSheet } from '$lib/server/google-sheets.js';
import { ensureFolderStructure, ensureProjectFolder, moveFileToArchive, extractFileId } from '$lib/server/google-drive.js';
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

  // Proportionally adjust all line items if price changed
  if (adjustedPrice && adjustedPrice !== quote.grand_total) {
    const ratio = adjustedPrice / quote.grand_total;

    // Scale every section and its items
    for (const section of quote.sections) {
      for (const item of section.items) {
        item.sales_price = Math.round(item.sales_price * ratio * 100) / 100;
        item.sub_cost = Math.round(item.sub_cost * ratio * 100) / 100;
      }
      section.sales_price = Math.round(section.sales_price * ratio * 100) / 100;
      section.sub_cost = Math.round(section.sub_cost * ratio * 100) / 100;
    }

    // Scale surcharges
    for (const s of quote.surcharges) {
      s.sales_amount = Math.round(s.sales_amount * ratio * 100) / 100;
      s.sub_amount = Math.round(s.sub_amount * ratio * 100) / 100;
    }

    // Scale totals
    quote.labor_subtotal = Math.round(quote.labor_subtotal * ratio * 100) / 100;
    quote.labor_total = Math.round(quote.labor_total * ratio * 100) / 100;
    quote.materials_total = Math.round(quote.materials_total * ratio * 100) / 100;
    for (const m of quote.materials) {
      m.cost = Math.round(m.cost * ratio * 100) / 100;
    }

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

  // Regenerate Google Doc/Sheet if connected
  if (tenant.google_refresh_token) {
    try {
      const clientId = env.GOOGLE_CLIENT_ID;
      const clientSecret = env.GOOGLE_CLIENT_SECRET;

      // Set up project folder structure
      let projectFolderId = sub.google_drive_project_folder_id || null;
      if (clientId && clientSecret) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Ensure GQ > Deals > Active / Inactive folder structure
        const folders = await ensureFolderStructure(drive, tenant);

        // Ensure project folder exists under Active
        if (!projectFolderId) {
          projectFolderId = await ensureProjectFolder(drive, folders.activeId, sub.address, params.id);
        }

        // Archive old Google file if it exists
        if (sub.google_doc_url) {
          const oldFileId = extractFileId(sub.google_doc_url);
          if (oldFileId && projectFolderId) {
            try {
              await moveFileToArchive(drive, oldFileId, projectFolderId);
            } catch (archiveErr) {
              console.warn('[regenerate] Could not archive old file:', archiveErr);
            }
          }
        }
      }

      // Create new file in project folder
      if (tenant.output_format === 'google_sheets' && (sub.trade_type === 'interior' || sub.trade_type === 'exterior')) {
        const estimateDoc = sub.trade_type === 'interior'
          ? assembleInteriorEstimate(scope as InteriorScopeData, quote, tenantInfo, params.id)
          : assembleExteriorEstimate(scope as ExteriorScopeData, quote, tenantInfo, params.id);
        googleDocUrl = await createEstimateSheet(tenant, estimateDoc, projectFolderId);
      } else {
        googleDocUrl = await createEstimateDoc(tenant, scope.client, quote, params.id, projectFolderId);
      }
      if (googleDocUrl) {
        db.update(submissions).set({ google_doc_url: googleDocUrl }).where(eq(submissions.id, params.id)).run();
      }
    } catch (err) {
      console.error('[regenerate] Google Doc/Sheet failed:', err);
    }
  }

  return json({ success: true, pdf_url: pdfUrl, google_doc_url: googleDocUrl, quote });
};
