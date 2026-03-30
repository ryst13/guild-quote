import { redirect } from '@sveltejs/kit';
import { getTenantById, defaultCatalog } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  return {
    catalog: tenant.catalog,
    defaultCatalog,
    tenantSlug: tenant.slug,
  };
};
