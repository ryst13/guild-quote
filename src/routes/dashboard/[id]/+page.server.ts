import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenantConfig = getTenantById(locals.user.tenant_id);
  if (!tenantConfig) throw redirect(303, '/auth/register');

  const sub = db.select().from(submissions)
    .where(and(
      eq(submissions.id, params.id),
      eq(submissions.tenant_id, locals.user.tenant_id)
    ))
    .get();

  if (!sub) throw error(404, 'Submission not found');

  return {
    submission: {
      ...sub,
      scope: sub.scope_json ? JSON.parse(sub.scope_json) : {},
      quote: sub.quote_json ? JSON.parse(sub.quote_json) : null,
    },
    tenant: { slug: tenantConfig.slug, company_name: tenantConfig.company_name },
  };
};
