import { error, redirect } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { parsePdfFilename, canAccessPdf } from '$lib/server/pdf-access.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, locals, request }) => {
  // PDFs contain client names, addresses, and prices — owner-only.
  if (!locals.user || !locals.user.tenant_id) {
    // A person clicking a stale dashboard link gets the login page, not JSON
    if (request.headers.get('accept')?.includes('text/html')) throw redirect(303, '/auth/login');
    throw error(401, 'Sign in to view this file.');
  }

  const parsed = parsePdfFilename(params.id);
  if (!parsed) throw error(404, 'PDF not found');

  const sub = db
    .select({ tenant_id: submissions.tenant_id })
    .from(submissions)
    .where(eq(submissions.id, parsed.submissionId))
    .get();
  // 404 (not 403) for other tenants — don't reveal that the estimate exists.
  if (!sub || !canAccessPdf(locals.user, sub.tenant_id)) throw error(404, 'PDF not found');

  const pdfPath = resolve(`./data/pdfs/${parsed.filename}`);
  if (!existsSync(pdfPath)) throw error(404, 'PDF not found');

  const pdfBuffer = readFileSync(pdfPath);

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="estimate-${params.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
