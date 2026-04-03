/**
 * Quick Calibrate: Takes ~15 anchor prices from a contractor and
 * back-calculates wall $/sqft, ceiling $/sqft, and item rates
 * to build a proportional pricing model.
 *
 * The idea: "Medium Bedroom walls only = $X" → derive wall $/sqft → scale all rooms.
 */

// Reference: Medium Bedroom wall sqft from the lookup table
const MEDIUM_BEDROOM_WALL_SQFT = 384;
const MEDIUM_BEDROOM_CEILING_RATIO = 0.45;

export interface CalibrationAnswers {
  // Interior anchors
  medium_bedroom_walls_only: number;  // e.g., $600 → wall rate = 600/384 = $1.56/sqft
  medium_bedroom_walls_ceiling: number; // e.g., $750 → ceiling rate derived
  per_door_rate: number;              // e.g., $75 per door
  per_window_rate: number;            // e.g., $85 per window
  per_trim_lf_rate: number;           // e.g., $65 per baseboard/crown section

  // Exterior anchors
  exterior_siding_per_side: number;   // e.g., $1,200 per side
  exterior_door_rate: number;         // e.g., $120 per door
  exterior_window_rate: number;       // e.g., $90 per window
  exterior_trim_rate: number;         // e.g., $80 per trim section

  // Epoxy
  epoxy_per_sqft: number;             // e.g., $6/sqft

  // Business
  labor_multiplier: number;           // e.g., 1.1 (10% markup over sub cost)
  cc_fee_pct: number;                 // e.g., 3.2%
  deposit_pct: number;                // e.g., 30%
  transportation_fee: number;         // e.g., $50
  trash_fee: number;                  // e.g., $50
}

export interface CalibratedRates {
  wall_rate_sales: number;       // $/sqft for walls
  ceiling_rate_sales: number;    // $/sqft for ceilings
  wall_rate_sub: number;
  ceiling_rate_sub: number;
  interior_items: Record<string, { sub_cost: number; sales_price: number }>;
  exterior_items: Record<string, number>;
  epoxy_base_rate: number;
  labor_multiplier: number;
  cc_fee_pct: number;
  deposit_pct: number;
  transportation_fee: number;
  trash_fee: number;
}

export function calibrateFromAnchors(answers: CalibrationAnswers): CalibratedRates {
  // Derive wall rate from medium bedroom price
  const wallRateSales = answers.medium_bedroom_walls_only / MEDIUM_BEDROOM_WALL_SQFT;
  const wallRateSub = wallRateSales / answers.labor_multiplier;

  // Derive ceiling rate: (walls+ceiling price - walls price) / ceiling sqft
  const ceilingSqft = MEDIUM_BEDROOM_WALL_SQFT * MEDIUM_BEDROOM_CEILING_RATIO;
  const ceilingOnlyPrice = answers.medium_bedroom_walls_ceiling - answers.medium_bedroom_walls_only;
  const ceilingRateSales = ceilingOnlyPrice > 0 ? ceilingOnlyPrice / ceilingSqft : wallRateSales * 0.83;
  const ceilingRateSub = ceilingRateSales / answers.labor_multiplier;

  // Scale interior item rates proportionally from the anchor prices
  const doorSubCost = answers.per_door_rate / answers.labor_multiplier;
  const windowSubCost = answers.per_window_rate / answers.labor_multiplier;
  const trimSubCost = answers.per_trim_lf_rate / answers.labor_multiplier;

  const interiorItems: Record<string, { sub_cost: number; sales_price: number }> = {
    "Door - Frame Standard":     { sub_cost: doorSubCost * 0.60, sales_price: answers.per_door_rate * 0.55 },
    "Door - Frame Double":       { sub_cost: doorSubCost * 0.90, sales_price: answers.per_door_rate * 0.82 },
    "Door - Flat":               { sub_cost: doorSubCost * 0.60, sales_price: answers.per_door_rate * 0.82 },
    "Door - w/ Panels":          { sub_cost: doorSubCost * 0.90, sales_price: answers.per_door_rate * 1.12 },
    "Door - w/ Glass":           { sub_cost: doorSubCost * 1.20, sales_price: answers.per_door_rate * 1.10 },
    "Window - Standard Frame":   { sub_cost: windowSubCost,      sales_price: answers.per_window_rate },
    "Window - Small Frame":      { sub_cost: windowSubCost * 0.75, sales_price: answers.per_window_rate * 0.75 },
    "Trim - Baseboard/Crown":    { sub_cost: trimSubCost,        sales_price: answers.per_trim_lf_rate },
    "Trim - Wainscotting":       { sub_cost: trimSubCost * 2.0,  sales_price: answers.per_trim_lf_rate * 2.67 },
    "Trim - Spindles/Balusters": { sub_cost: trimSubCost * 5.1,  sales_price: answers.per_trim_lf_rate * 5.10 },
    "Trim - Radiator":           { sub_cost: trimSubCost * 1.33, sales_price: answers.per_trim_lf_rate * 1.33 },
    "Trim - Handrail":           { sub_cost: trimSubCost,        sales_price: answers.per_trim_lf_rate },
    "Repair - Drywall Repair":   { sub_cost: doorSubCost * 0.60, sales_price: answers.per_door_rate * 1.12 },
  };

  return {
    wall_rate_sales: wallRateSales,
    ceiling_rate_sales: ceilingRateSales,
    wall_rate_sub: wallRateSub,
    ceiling_rate_sub: ceilingRateSub,
    interior_items: interiorItems,
    exterior_items: {
      siding_per_side: answers.exterior_siding_per_side,
      door_rate: answers.exterior_door_rate,
      window_rate: answers.exterior_window_rate,
      trim_rate: answers.exterior_trim_rate,
    },
    epoxy_base_rate: answers.epoxy_per_sqft,
    labor_multiplier: answers.labor_multiplier,
    cc_fee_pct: answers.cc_fee_pct,
    deposit_pct: answers.deposit_pct,
    transportation_fee: answers.transportation_fee,
    trash_fee: answers.trash_fee,
  };
}

// ─── REVERSE CALIBRATION: Costs → Prices ────────────────────────
// Given wage + margin, calculate what anchor prices should be.

export interface CostInputs {
  crew_hourly_wage: number;     // $/hr per painter
  target_gross_margin: number;  // 0.00-1.00 (e.g., 0.40 = 40%)
}

export interface ImpliedPrices {
  medium_bedroom_walls_only: number;
  medium_bedroom_walls_ceiling: number;
  per_door_rate: number;
  per_window_rate: number;
  per_trim_lf_rate: number;
  exterior_siding_per_side: number;
  exterior_door_rate: number;
  exterior_window_rate: number;
  exterior_trim_rate: number;
  epoxy_per_sqft: number;
  effective_billing_rate: number;  // $/hr billed to customer
}

// Production rates (from pricing-v2.ts)
const PROD = {
  walls: 150,     // sqft/hr
  ceiling: 120,   // sqft/hr
  door_frame: 0.30,   // hr/item
  window_std: 0.45,   // hr/item
  trim_baseboard: 0.50, // hr/item
  ext_siding_sqft_per_side: 200,
  ext_siding_rate: 180,  // sqft/hr (clapboard)
  ext_door: 0.75,    // hr/item
  ext_window: 0.50,  // hr/item
  ext_trim: 0.45,    // hr/item
  epoxy_coating: 150, // sqft/hr
};

// Complexity factors (from pricing-v2.ts, baked-in for GQ tier)
const CF = {
  walls: 1.00,
  ceiling: 0.666,
  door_frame: 2.78,
  window_std: 3.71,
  trim_baseboard: 2.50,
  ext_siding: 9.99,  // clapboard
  ext_door: 2.22,
  ext_window: 3.33,
  ext_trim: 3.70,
  epoxy: 15.14,      // standard epoxy
};

export function calibrateFromCosts(inputs: CostInputs): ImpliedPrices {
  const { crew_hourly_wage: wage, target_gross_margin: margin } = inputs;
  const billing = wage / (1 - margin);

  // Medium Bedroom walls: 384 sqft / 150 sqft/hr = 2.56 hrs × billing × cf
  const wallHours = MEDIUM_BEDROOM_WALL_SQFT / PROD.walls;
  const bedroomWalls = wallHours * billing * CF.walls;

  // Ceiling: 384 × 0.45 = 173 sqft / 120 sqft/hr
  const ceilingSqft = MEDIUM_BEDROOM_WALL_SQFT * MEDIUM_BEDROOM_CEILING_RATIO;
  const ceilingHours = ceilingSqft / PROD.ceiling;
  const bedroomWallsCeiling = bedroomWalls + (ceilingHours * billing * CF.ceiling);

  // Items: hours × billing × complexity_factor
  const doorRate = PROD.door_frame * billing * CF.door_frame;
  const windowRate = PROD.window_std * billing * CF.window_std;
  const trimRate = PROD.trim_baseboard * billing * CF.trim_baseboard;

  // Exterior
  const sidingHours = PROD.ext_siding_sqft_per_side / PROD.ext_siding_rate;
  const sidingPerSide = sidingHours * billing * CF.ext_siding;
  const extDoorRate = PROD.ext_door * billing * CF.ext_door;
  const extWindowRate = PROD.ext_window * billing * CF.ext_window;
  const extTrimRate = PROD.ext_trim * billing * CF.ext_trim;

  // Epoxy: per sqft = (1/prodRate) × billing × cf
  const epoxyPerSqft = (1 / PROD.epoxy_coating) * billing * CF.epoxy;

  return {
    medium_bedroom_walls_only: Math.round(bedroomWalls * 100) / 100,
    medium_bedroom_walls_ceiling: Math.round(bedroomWallsCeiling * 100) / 100,
    per_door_rate: Math.round(doorRate * 100) / 100,
    per_window_rate: Math.round(windowRate * 100) / 100,
    per_trim_lf_rate: Math.round(trimRate * 100) / 100,
    exterior_siding_per_side: Math.round(sidingPerSide),
    exterior_door_rate: Math.round(extDoorRate * 100) / 100,
    exterior_window_rate: Math.round(extWindowRate * 100) / 100,
    exterior_trim_rate: Math.round(extTrimRate * 100) / 100,
    epoxy_per_sqft: Math.round(epoxyPerSqft * 100) / 100,
    effective_billing_rate: Math.round(billing * 100) / 100,
  };
}

/** Default anchor prices derived from RP's actual pricing data */
export const DEFAULT_ANCHORS: CalibrationAnswers = {
  medium_bedroom_walls_only: 115,    // Based on Medium Bedroom @ $0.30/sqft × 384 sqft
  medium_bedroom_walls_ceiling: 158, // + ceiling at $0.25/sqft × 173 sqft
  per_door_rate: 62,
  per_window_rate: 83,
  per_trim_lf_rate: 62,
  exterior_siding_per_side: 800,
  exterior_door_rate: 120,
  exterior_window_rate: 90,
  exterior_trim_rate: 80,
  epoxy_per_sqft: 6,
  labor_multiplier: 1.1,
  cc_fee_pct: 3.2,
  deposit_pct: 30,
  transportation_fee: 50,
  trash_fee: 50,
};
