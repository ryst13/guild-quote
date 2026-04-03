import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and, count } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { getAccessState } from '$lib/server/features.js';
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

  const access = getAccessState(tenantConfig);

  // Count total estimates for this tenant (for ML teaser gating)
  const [{ total }] = db.select({ total: count() }).from(submissions)
    .where(eq(submissions.tenant_id, locals.user.tenant_id))
    .all();

  return {
    submission: {
      ...sub,
      scope: sub.scope_json ? JSON.parse(sub.scope_json) : {},
      quote: sub.quote_json ? JSON.parse(sub.quote_json) : null,
      previous_versions: sub.previous_versions_json ? JSON.parse(sub.previous_versions_json) : [],
    },
    tenant: {
      slug: tenantConfig.slug,
      company_name: tenantConfig.company_name,
      output_format: tenantConfig.output_format || 'google_docs',
      sub_mode_enabled: tenantConfig.sub_mode_enabled ?? false,
      sub_margin: tenantConfig.sub_margin ?? 0.10,
    },
    plan: access.plan,
    isPro: access.plan === 'gq_pro' || access.isTrialing,
    estimateCount: total,
  };
};
