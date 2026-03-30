import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions, tenants } from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenantConfig = getTenantById(locals.user.tenant_id);
  if (!tenantConfig) throw redirect(303, '/auth/register');

  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();

  const subs = db.select().from(submissions)
    .where(eq(submissions.tenant_id, locals.user.tenant_id))
    .orderBy(desc(submissions.created_at))
    .all();

  // Analytics
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSubs = subs.filter(s => s.created_at.startsWith(thisMonth));
  const totalValue = thisMonthSubs.reduce((sum, s) => sum + (s.sales_price || 0), 0);
  const sentCount = thisMonthSubs.filter(s => s.estimate_status !== 'draft').length;
  const acceptedCount = thisMonthSubs.filter(s => s.estimate_status === 'accepted').length;
  const conversionRate = sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;

  return {
    submissions: subs.map(s => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      address: s.address,
      sales_price: s.sales_price,
      trade_type: s.trade_type,
      estimate_status: s.estimate_status,
      created_at: s.created_at,
    })),
    analytics: {
      quotesThisMonth: thisMonthSubs.length,
      totalValue,
      conversionRate,
    },
    tenant: {
      slug: tenantConfig.slug,
      company_name: tenantConfig.company_name,
      primary_color: tenantConfig.primary_color,
      enabled_trades: tenantConfig.enabled_trades,
      onboarding_completed: tenant?.onboarding_completed ?? false,
    },
  };
};
