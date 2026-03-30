import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { sendEmail, buildStatusUpdateEmail } from '$lib/server/email.js';
import type { RequestHandler } from './$types.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export const POST: RequestHandler = async ({ locals, params }) => {
  if (!locals.user || locals.user.role === 'homeowner') throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const sub = db.select().from(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .get();

  if (!sub) throw error(404, 'Not found');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw error(400, 'Tenant not found');

  const stage = tenant.stages.find(s => s.key === sub.stage_key);
  const stageName = stage?.portal_client_label || sub.stage_key;
  const portalUrl = `${BASE_URL}/client`;

  const html = buildStatusUpdateEmail(sub.first_name, stageName, tenant, portalUrl);
  await sendEmail({
    to: sub.email,
    subject: `Project Update — ${tenant.company_name}`,
    html,
    from: `"${tenant.company_name}" <${process.env.SMTP_USER || 'noreply@smartquotepro.com'}>`,
  });

  return json({ success: true });
};
