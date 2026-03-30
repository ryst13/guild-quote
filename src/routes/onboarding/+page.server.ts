import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getTenantById, defaultCatalog } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login');
  }
  if (!locals.user.tenant_id) {
    throw redirect(303, '/auth/register');
  }

  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (!tenant) throw redirect(303, '/auth/register');

  const tenantConfig = getTenantById(locals.user.tenant_id);
  let enabledTrades: string[] = [];
  try { enabledTrades = JSON.parse(tenant.enabled_trades); } catch {}

  return {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      company_name: tenant.company_name,
      contact_email: tenant.contact_email,
      contact_phone: tenant.contact_phone,
      website_url: tenant.website_url,
      service_areas: tenant.service_areas,
      primary_color: tenant.primary_color,
      accent_color: tenant.accent_color,
      logo_url: tenant.logo_url,
      onboarding_completed: tenant.onboarding_completed,
      enabled_trades: enabledTrades,
      google_refresh_token: tenant.google_refresh_token,
    },
    catalog: tenantConfig?.catalog || defaultCatalog,
  };
};
