import { error } from '@sveltejs/kit';
import { getTenantBySlug } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params }) => {
  const tenant = getTenantBySlug(params.slug);
  if (!tenant) throw error(404, 'Contractor not found');

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      company_name: tenant.company_name,
      logo_url: tenant.logo_url,
      primary_color: tenant.primary_color,
      accent_color: tenant.accent_color,
      contact_phone: tenant.contact_phone,
      contact_email: tenant.contact_email,
    },
    catalog: tenant.catalog,
  };
};
