import { redirect } from '@sveltejs/kit';
import { getTenantById } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  // Parse pricing config from tenant, or return defaults
  let pricingConfig;
  try {
    pricingConfig = tenant.pricing_config ? JSON.parse(tenant.pricing_config as string) : null;
  } catch {
    pricingConfig = null;
  }

  const defaults = {
    surcharges: {
      trash_enabled: true,
      trash_interior: 50,
      trash_exterior: 225,
      transportation_enabled: true,
      transportation_amount: 50,
      cc_fee_enabled: true,
      cc_fee_pct: 3.2,
      color_samples_enabled: true,
      color_samples_amount: 98.95,
    },
    materials: {
      interior: {
        walls: { product: 'Regal Select Eggshell', coverage: 350, price_per_gallon: 63.59 },
        trim: { product: 'Regal Select Semi Gloss', coverage: 350, price_per_gallon: 63.59 },
        primer: { product: 'Fresh Start', coverage: 400, price_per_gallon: 44.99 },
        ceiling: { product: 'Ben Moore Muresco', coverage: 400, price_per_gallon: 40.78 },
      },
      exterior: {
        siding: { product: 'Moorgard Low Lustre', coverage: 300, price_per_gallon: 69.59 },
        trim: { product: 'Moorgard Soft Gloss', coverage: 300, price_per_gallon: 69.59 },
      },
      epoxy: {
        coating: { product: 'Epoxy / Coating', coverage: 200, price_per_gallon: 85.00 },
        primer: { product: 'Concrete Primer', coverage: 300, price_per_gallon: 55.00 },
      },
    },
    labor_multiplier: tenant.labor_price_multiplier || 1.1,
    payment_terms: {
      deposit_pct: 30,
      progress_threshold: 10000,
    },
  };

  return {
    config: pricingConfig || defaults,
    defaults,
    enabledTrades: tenant.enabled_trades,
    outputFormat: tenant.output_format || 'google_docs',
    showLosp: tenant.show_losp ?? true,
    crewHourlyWage: tenant.crew_hourly_wage,
    defaultCrewSize: tenant.default_crew_size ?? 2,
    targetGrossMargin: tenant.target_gross_margin,
    pricingMode: tenant.pricing_mode ?? 'top_down',
    metroArea: tenant.metro_area,
    subModeEnabled: tenant.sub_mode_enabled ?? false,
    subMargin: tenant.sub_margin,
  };
};
