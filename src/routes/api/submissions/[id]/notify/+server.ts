import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { sendEmail } from '$lib/server/email.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const sub = db.select().from(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .get();

  if (!sub) throw error(404, 'Not found');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw error(400, 'Tenant not found');

  await sendEmail({
    to: sub.email,
    subject: `Your Estimate from ${tenant.company_name}`,
    html: `<p>Hi ${sub.first_name},</p><p>Your estimate is ready. Please contact ${tenant.company_name} for details.</p>`,
    from: `"${tenant.company_name}" <${process.env.SMTP_USER || 'noreply@guildquote.com'}>`,
  });

  return json({ success: true });
};
