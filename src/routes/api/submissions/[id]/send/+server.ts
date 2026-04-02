import { json, error } from '@sveltejs/kit';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { sendEmail } from '$lib/server/email.js';
import { readFileSync, existsSync } from 'fs';
import type { RequestHandler } from './$types.js';

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
  const { to, subject, message, attach_pdf, include_doc_link } = body;

  if (!to) throw error(400, 'Recipient email required');

  // Build HTML email body from the plain text message
  let htmlMessage = message.replace(/\n/g, '<br>');

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

  // Load PDF attachment if requested
  let pdfBuffer: Buffer | null = null;
  if (attach_pdf) {
    const pdfPath = `./data/pdfs/${params.id}.pdf`;
    if (existsSync(pdfPath)) {
      pdfBuffer = readFileSync(pdfPath);
    }
  }

  let sent = false;

  // Try Gmail API first if contractor has Google connected
  if (tenant.google_refresh_token && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    try {
      const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
      oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Build MIME message
      const boundary = `boundary_${Date.now()}`;
      let mimeMessage = [
        `From: "${tenant.company_name}" <me>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
      ];

      if (pdfBuffer) {
        mimeMessage.push(`Content-Type: multipart/mixed; boundary="${boundary}"`, '');
        mimeMessage.push(`--${boundary}`);
        mimeMessage.push('Content-Type: text/html; charset=utf-8', '');
        mimeMessage.push(htmlBody);
        mimeMessage.push(`--${boundary}`);
        mimeMessage.push(`Content-Type: application/pdf; name="estimate-${params.id.slice(0, 8)}.pdf"`);
        mimeMessage.push('Content-Transfer-Encoding: base64');
        mimeMessage.push(`Content-Disposition: attachment; filename="estimate-${params.id.slice(0, 8)}.pdf"`, '');
        mimeMessage.push(pdfBuffer.toString('base64'));
        mimeMessage.push(`--${boundary}--`);
      } else {
        mimeMessage.push('Content-Type: text/html; charset=utf-8', '');
        mimeMessage.push(htmlBody);
      }

      const raw = Buffer.from(mimeMessage.join('\r\n')).toString('base64url');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      sent = true;
      console.log(`[gmail] Sent estimate ${params.id.slice(0, 8)} to ${to}`);
    } catch (err) {
      console.error('[gmail] Failed, falling back to SMTP:', err);
    }
  }

  // Fallback to SMTP/Resend
  if (!sent) {
    const attachments = pdfBuffer
      ? [{ filename: `estimate-${params.id.slice(0, 8)}.pdf`, content: pdfBuffer }]
      : undefined;

    sent = await sendEmail({
      to,
      subject,
      html: htmlBody,
      from: `"${tenant.company_name}" <${tenant.contact_email || 'noreply@guildquote.com'}>`,
      attachments,
    });
  }

  if (sent) {
    // Update status to 'sent' and store recipient email
    db.update(submissions).set({
      estimate_status: 'sent',
      email: to,
      updated_at: new Date().toISOString(),
    }).where(eq(submissions.id, params.id)).run();
  }

  return json({ success: sent });
};
