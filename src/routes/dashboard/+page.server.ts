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
  const sentCount = subs.filter(s => s.estimate_status !== 'draft').length;
  const acceptedCount = subs.filter(s => s.estimate_status === 'accepted').length;
  const conversionRate = sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0;

  // Self-benchmarking (only meaningful with 10+ estimates)
  let benchmarks = null;
  if (subs.length >= 10) {
    const withPrice = subs.filter(s => s.sales_price && s.sales_price > 0);
    const avgEstimate = withPrice.length > 0 ? Math.round(withPrice.reduce((s, sub) => s + (sub.sales_price || 0), 0) / withPrice.length) : 0;

    // Per-trade averages
    const tradeAvgs: Record<string, { count: number; avg: number; winRate: number }> = {};
    for (const trade of tenantConfig.enabled_trades) {
      const tradeSubs = subs.filter(s => s.trade_type === trade);
      const tradeWithPrice = tradeSubs.filter(s => s.sales_price && s.sales_price > 0);
      const tradeSent = tradeSubs.filter(s => s.estimate_status !== 'draft');
      const tradeAccepted = tradeSubs.filter(s => s.estimate_status === 'accepted');
      tradeAvgs[trade] = {
        count: tradeSubs.length,
        avg: tradeWithPrice.length > 0 ? Math.round(tradeWithPrice.reduce((s, sub) => s + (sub.sales_price || 0), 0) / tradeWithPrice.length) : 0,
        winRate: tradeSent.length > 0 ? Math.round((tradeAccepted.length / tradeSent.length) * 100) : 0,
      };
    }

    benchmarks = { avgEstimate, tradeAvgs, totalEstimates: subs.length };
  }

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
    benchmarks,
    tenant: {
      slug: tenantConfig.slug,
      company_name: tenantConfig.company_name,
      primary_color: tenantConfig.primary_color,
      enabled_trades: tenantConfig.enabled_trades,
      onboarding_completed: tenant?.onboarding_completed ?? false,
    },
  };
};
