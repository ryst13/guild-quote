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
      contact_email: tenant.contact_email,
      contact_phone: tenant.contact_phone,
      website_url: tenant.website_url,
      service_areas: tenant.service_areas,
      primary_color: tenant.primary_color,
      accent_color: tenant.accent_color,
      logo_url: tenant.logo_url,
    },
  };
};
