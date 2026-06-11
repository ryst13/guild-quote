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

// ── Materials ────────────────────────────────────────────────────
// Same pattern as surcharges: tenant's Materials tab (pricing_config.materials)
// resolved against the historical engine constants.

export interface PaintSpec {
  product: string;
  coverage: number; // sqft per gallon
  price_per_gallon: number;
}

export interface ResolvedMaterials {
  interior: { walls: PaintSpec; trim: PaintSpec; primer: PaintSpec; ceiling: PaintSpec };
  exterior: { siding: PaintSpec; trim: PaintSpec };
  epoxy: { coating: PaintSpec; primer: PaintSpec };
}

export const DEFAULT_MATERIALS: ResolvedMaterials = {
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
    coating: { product: 'Epoxy / Coating', coverage: 200, price_per_gallon: 85.0 },
    primer: { product: 'Concrete Primer', coverage: 300, price_per_gallon: 55.0 },
  },
};

function resolvePaint(spec: { product?: string; coverage?: number; price_per_gallon?: number } | undefined, fallback: PaintSpec): PaintSpec {
  return {
    product: spec?.product || fallback.product,
    // Coverage must be a positive divisor; guard against 0/negative input
    coverage: spec?.coverage && spec.coverage > 0 ? spec.coverage : fallback.coverage,
    price_per_gallon: spec?.price_per_gallon != null && spec.price_per_gallon >= 0 ? spec.price_per_gallon : fallback.price_per_gallon,
  };
}

export function resolveMaterials(
  tenant?: Pick<TenantConfig, 'pricing_config'> | null,
): ResolvedMaterials {
  const m = tenant?.pricing_config?.materials;
  if (!m) return DEFAULT_MATERIALS;
  const d = DEFAULT_MATERIALS;
  return {
    interior: {
      walls: resolvePaint(m.interior?.walls, d.interior.walls),
      trim: resolvePaint(m.interior?.trim, d.interior.trim),
      primer: resolvePaint(m.interior?.primer, d.interior.primer),
      ceiling: resolvePaint(m.interior?.ceiling, d.interior.ceiling),
    },
    exterior: {
      siding: resolvePaint(m.exterior?.siding, d.exterior.siding),
      trim: resolvePaint(m.exterior?.trim, d.exterior.trim),
    },
    epoxy: {
      coating: resolvePaint(m.epoxy?.coating, d.epoxy.coating),
      primer: resolvePaint(m.epoxy?.primer, d.epoxy.primer),
    },
  };
}

// Bundle for the legacy (top-down) engine, which has no tenant object —
// callers resolve once and pass the bundle; absent fields fall back to defaults.
export interface EngineConfig {
  surcharges?: ResolvedSurcharges;
  materials?: ResolvedMaterials;
}

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
