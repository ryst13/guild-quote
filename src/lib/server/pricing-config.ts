import type { TenantConfig } from '$lib/types/index.js';

// Resolved, engine-ready surcharge settings. Tenant settings (Pricing →
// Surcharges tab) are stored as JSON in tenants.pricing_config; this resolves
// them against the historical engine defaults so a tenant with no config (or
// a partial one) prices byte-identically to the pre-wiring engines.
export interface ResolvedSurcharges {
  trash_enabled: boolean;
  trash_interior: number;
  trash_exterior: number;
  transportation_enabled: boolean;
  transportation_amount: number;
  cc_fee_enabled: boolean;
  cc_pct: number; // fraction, e.g. 0.032
  color_samples_enabled: boolean;
  color_samples_amount: number;
}

export const DEFAULT_SURCHARGES: ResolvedSurcharges = {
  trash_enabled: true,
  trash_interior: 50,
  trash_exterior: 225,
  transportation_enabled: true,
  transportation_amount: 50,
  cc_fee_enabled: true,
  cc_pct: 0.032,
  color_samples_enabled: true,
  color_samples_amount: 98.95,
};

export function resolveSurcharges(
  tenant?: Pick<TenantConfig, 'pricing_config'> | null,
): ResolvedSurcharges {
  const s = tenant?.pricing_config?.surcharges;
  if (!s) return DEFAULT_SURCHARGES;
  return {
    trash_enabled: s.trash_enabled ?? DEFAULT_SURCHARGES.trash_enabled,
    trash_interior: s.trash_interior ?? DEFAULT_SURCHARGES.trash_interior,
    trash_exterior: s.trash_exterior ?? DEFAULT_SURCHARGES.trash_exterior,
    transportation_enabled: s.transportation_enabled ?? DEFAULT_SURCHARGES.transportation_enabled,
    transportation_amount: s.transportation_amount ?? DEFAULT_SURCHARGES.transportation_amount,
    cc_fee_enabled: s.cc_fee_enabled ?? DEFAULT_SURCHARGES.cc_fee_enabled,
    // The settings UI and calibrate both store percent (3.2), engines use a fraction.
    cc_pct: (s.cc_fee_pct ?? 3.2) / 100,
    color_samples_enabled: s.color_samples_enabled ?? DEFAULT_SURCHARGES.color_samples_enabled,
    color_samples_amount: s.color_samples_amount ?? DEFAULT_SURCHARGES.color_samples_amount,
  };
}
