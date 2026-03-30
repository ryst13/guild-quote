import { redirect } from '@sveltejs/kit';
import { getTenantById } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  return {
    tenant: {
      company_name: tenant.company_name,
      enabled_trades: tenant.enabled_trades,
      primary_color: tenant.primary_color,
    },
  };
};
