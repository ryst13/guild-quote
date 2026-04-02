import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants, submissions } from '$lib/server/schema.js';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user?.is_platform_admin) throw redirect(303, '/dashboard');

  const allTenants = db.select().from(tenants).all();

  // Count estimates per tenant
  const estimateCounts = db.select({
    tenant_id: submissions.tenant_id,
    count: sql<number>`count(*)`,
  }).from(submissions).groupBy(submissions.tenant_id).all();

  const countMap = new Map(estimateCounts.map(e => [e.tenant_id, e.count]));

  const tenantList = allTenants.map(t => ({
    id: t.id,
    company_name: t.company_name,
    contact_email: t.contact_email,
    plan: t.plan || 'trial',
    payment_status: t.payment_status || 'none',
    lifetime_access: t.lifetime_access || false,
    trial_ends_at: t.trial_ends_at,
    referral_code: t.referral_code,
    referral_credits: t.referral_credits || 0,
    referred_by: t.referred_by,
    estimates_count: countMap.get(t.id) || 0,
    created_at: t.created_at,
  }));

  const stats = {
    total: tenantList.length,
    trialing: tenantList.filter(t => t.payment_status === 'trialing').length,
    active: tenantList.filter(t => t.payment_status === 'active').length,
    canceled: tenantList.filter(t => t.payment_status === 'canceled').length,
    lifetime: tenantList.filter(t => t.lifetime_access).length,
  };

  return { tenants: tenantList, stats };
};
