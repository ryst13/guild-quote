import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { runInteriorEngine } from '$lib/server/price-book.js';
import type { InteriorScopeData } from '$lib/types/index.js';
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

  // A real number from the real engine at the tenant's current settings —
  // shows what a typical 3-room repaint quotes before any setup is done.
  let sampleEstimateTotal: number | null = null;
  if (tenantConfig) {
    try {
      const room = (type: string, size: string, items: Record<string, number>) => ({
        id: type, room_type: type, room_size: size, ceiling_included: true,
        closet: 'not_included', primer_required: false, items, specialty: [], notes: '',
      });
      const sampleScope = {
        client: { name: 'Sample', address: '', email: '', phone: '', notes: '' },
        rooms: [
          room('Living Room', 'Medium', { 'Trim - Baseboard/Crown': 1, 'Window - Standard Frame': 2 }),
          room('Bedroom', 'Medium', { 'Door - Frame Standard': 1, 'Window - Standard Frame': 1 }),
          room('Bathroom', 'Small', { 'Door - Frame Standard': 1 }),
        ],
        project: { surface_grade: 'B', prep_level: 'Standard', color_samples: false, transportation: false, notes: '' },
      } as InteriorScopeData;
      const q = runInteriorEngine(tenantConfig, sampleScope);
      sampleEstimateTotal = Math.round(q.grand_total / 50) * 50;
    } catch {
      sampleEstimateTotal = null;
    }
  }

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
    sampleEstimateTotal: sampleEstimateTotal,
  };
};
