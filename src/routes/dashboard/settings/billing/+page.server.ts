import { redirect } from '@sveltejs/kit';
import { getTenantById } from '$lib/server/tenant.js';
import { getAccessState } from '$lib/server/features.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  const access = getAccessState(tenant);

  return {
    plan: tenant.plan,
    paymentStatus: tenant.payment_status,
    trialEndsAt: tenant.trial_ends_at,
    lifetimeAccess: tenant.lifetime_access,
    referralCode: tenant.referral_code,
    referralCredits: tenant.referral_credits,
    hasStripeCustomer: !!tenant.stripe_customer_id,
    access,
  };
};
