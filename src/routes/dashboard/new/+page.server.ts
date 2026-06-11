import { redirect } from '@sveltejs/kit';
import { getTenantById } from '$lib/server/tenant.js';
import { resolveSurcharges } from '$lib/server/pricing-config.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  const promptsShown = tenant.prompts_shown ? JSON.parse(tenant.prompts_shown as string) : {};
  const scfg = resolveSurcharges(tenant);

  return {
    tenant: {
      company_name: tenant.company_name,
      enabled_trades: tenant.enabled_trades,
      primary_color: tenant.primary_color,
      output_format: tenant.output_format || 'google_docs',
      has_default_colors: tenant.primary_color === '#2563eb',
      has_contact_info: !!(tenant.contact_phone && tenant.contact_email),
    },
    surcharges: {
      color_samples: scfg.color_samples_enabled ? scfg.color_samples_amount : 0,
      transportation: scfg.transportation_enabled ? scfg.transportation_amount : 0,
    },
    prompts: {
      show_pricing: !promptsShown.pricing_reviewed,
      show_branding: !promptsShown.branding_customized && tenant.primary_color === '#2563eb',
    },
  };
};
