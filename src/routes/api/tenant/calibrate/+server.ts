import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { invalidateTenantCache } from '$lib/server/tenant.js';
import { calibrateFromAnchors, calibrateFromCosts, type CalibrationAnswers, type CostInputs } from '$lib/server/calibrate.js';
import type { RequestHandler } from './$types.js';

// Calibrating counts as reviewing your prices (clears the New Estimate banner)
function markPricingReviewed(tenantId: string): string {
  const current = db.select({ prompts_shown: tenants.prompts_shown }).from(tenants)
    .where(eq(tenants.id, tenantId)).get();
  let prompts: Record<string, unknown> = {};
  try {
    prompts = current?.prompts_shown ? JSON.parse(current.prompts_shown) : {};
  } catch {
    prompts = {};
  }
  prompts.pricing_reviewed = true;
  return JSON.stringify(prompts);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const body = await request.json();

  // Support both modes: "I know my prices" (anchors) or "I know my costs" (wage+margin)
  const mode = body.mode as string | undefined;

  if (mode === 'costs') {
    // Reverse calibration: wage + margin → implied prices + update tenant settings
    const costInputs = body as CostInputs & { mode: string };
    const implied = calibrateFromCosts(costInputs);

    // Update tenant with bottom-up settings
    db.update(tenants).set({
      crew_hourly_wage: costInputs.crew_hourly_wage,
      target_gross_margin: costInputs.target_gross_margin,
      pricing_mode: 'bottom_up',
      prompts_shown: markPricingReviewed(locals.user.tenant_id),
      updated_at: new Date().toISOString(),
    }).where(eq(tenants.id, locals.user.tenant_id)).run();

    const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
    if (tenant) invalidateTenantCache(tenant.slug);

    return json({ success: true, implied, mode: 'costs' });
  }

  // Default: anchor-based calibration (existing behavior)
  const rates = calibrateFromAnchors(body as CalibrationAnswers);

  // Merge calibrated values into any existing config — calibration derives
  // amounts, but the tenant's enable/disable choices and unrelated settings
  // must survive a recalibration (engines now read this config).
  const existingRow = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  let existing: Record<string, any> = {};
  try {
    existing = existingRow?.pricing_config ? JSON.parse(existingRow.pricing_config) : {};
  } catch {
    existing = {};
  }

  const pricingConfig = {
    ...existing,
    surcharges: {
      trash_enabled: true,
      transportation_enabled: true,
      cc_fee_enabled: true,
      color_samples_enabled: true,
      color_samples_amount: 98.95,
      ...existing.surcharges,
      // Calibration-derived amounts overwrite
      trash_interior: rates.trash_fee,
      trash_exterior: rates.trash_fee * 4.5, // Exterior trash is typically higher
      transportation_amount: rates.transportation_fee,
      cc_fee_pct: rates.cc_fee_pct,
    },
    // Materials are not derived by calibration — keep the tenant's if set
    materials: existing.materials ?? {
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
    labor_multiplier: rates.labor_multiplier,
    payment_terms: {
      progress_threshold: 10000,
      ...existing.payment_terms,
      deposit_pct: rates.deposit_pct, // calibration-derived
    },
    calibrated_rates: rates, // Store the full calibrated rates for reference
  };

  db.update(tenants).set({
    pricing_config: JSON.stringify(pricingConfig),
    labor_price_multiplier: rates.labor_multiplier,
    prompts_shown: markPricingReviewed(locals.user.tenant_id),
    updated_at: new Date().toISOString(),
  }).where(eq(tenants.id, locals.user.tenant_id)).run();

  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (tenant) invalidateTenantCache(tenant.slug);

  return json({ success: true, rates });
};
