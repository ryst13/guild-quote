import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { getAccessState } from '$lib/server/features.js';
import { sendEmail, senderAddress } from '$lib/server/email.js';
import { readFileSync, existsSync } from 'fs';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw error(400, 'Tenant not found');

  const access = getAccessState(tenant);
  if (!access.canSendEmail) {
    throw error(402, 'Sending estimates by email is part of GQ Pro. You can still download the PDF and send it yourself.');
  }

  const sub = db.select().from(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .get();
  if (!sub) throw error(404, 'Submission not found');

  const body = await request.json();
  const { to, subject, message, attach_pdf, include_doc_link } = body;

  if (!to) throw error(400, 'Recipient email required');

  // Build HTML email body from the plain text message. The contractor writes
  // plain text; escape it so markup can't ride GuildQuote's sending domain.
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let htmlMessage = escapeHtml(String(message || '')).replace(/\n/g, '<br>');

  if (include_doc_link && sub.google_doc_url) {
    htmlMessage += `<br><br><a href="${sub.google_doc_url}" style="color: ${tenant.primary_color}; font-weight: 600;">View Estimate Document</a>`;
  }

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${tenant.primary_color}; margin-bottom: 4px;">${tenant.company_name}</h2>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <div style="color: #374151; line-height: 1.6;">${htmlMessage}</div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">
        Ref: ${params.id.slice(0, 8).toUpperCase()} | ${tenant.company_name}${tenant.contact_phone ? ` | ${tenant.contact_phone}` : ''}
      </p>
    </div>
  `;

  // Load PDF attachment if requested — never send "find attached" with nothing
  // attached (duplicated estimates have no PDF until one is created)
  let pdfBuffer: Buffer | null = null;
  if (attach_pdf) {
    const pdfPath = `./data/pdfs/${params.id}.pdf`;
    if (!existsSync(pdfPath)) {
      return json({ error: "This estimate doesn't have a PDF yet. Open the estimate and tap Create PDF first." }, { status: 400 });
    }
    pdfBuffer = readFileSync(pdfPath);
  }

  const attachments = pdfBuffer
    ? [{ filename: `estimate-${params.id.slice(0, 8)}.pdf`, content: pdfBuffer }]
    : undefined;

  const sent = await sendEmail({
    to,
    subject,
    html: htmlBody,
    from: `"${tenant.company_name}" <${senderAddress()}>`,
    replyTo: tenant.contact_email || undefined,
    attachments,
  });

  if (sent) {
    // Store recipient; only move draft/viewed forward — re-sending must not
    // knock a Won/Lost estimate back to 'sent'
    const keepStatus = sub.estimate_status === 'accepted' || sub.estimate_status === 'declined';
    db.update(submissions).set({
      ...(keepStatus ? {} : { estimate_status: 'sent' }),
      email: to,
      updated_at: new Date().toISOString(),
    }).where(eq(submissions.id, params.id)).run();
  }

  if (!sent) {
    return json({ error: "The email didn't send. Wait a minute and try again." }, { status: 502 });
  }
  return json({ success: true });
};
