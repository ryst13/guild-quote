/**
 * Bottom-Up Pricing Engine (v2)
 *
 * Calculates prices from: production_rate → hours → labor_cost → margin → price
 * Instead of the top-down $/sqft approach in pricing.ts.
 *
 * Same inputs (scope data), same outputs (QuoteResult), different math.
 */

import type {
  InteriorScopeData,
  ExteriorScopeData,
  EpoxyScopeData,
  QuoteResult,
  SectionResult,
  LineItem,
  CatalogConfig,
  TenantConfig,
} from '$lib/types/index.js';
import priceBenchmarks from '$lib/data/price-benchmarks.json';
import scopeCheckerRules from '$lib/data/scope-checker-rules.json';

// ─── BLS METRO WAGE DEFAULTS (SOC 47-2141, May 2024) ────────────
export const METRO_WAGES: Record<string, number> = {
  'boston': 28.50,
  'new_york': 30.20,
  'los_angeles': 24.60,
  'houston': 19.80,
  'dallas': 19.50,
  'chicago': 27.40,
  'atlanta': 20.80,
  'phoenix': 21.20,
  'miami': 20.40,
  'denver': 23.80,
  'seattle': 28.00,
  'san_francisco': 31.50,
  'philadelphia': 27.00,
  'washington_dc': 26.50,
  'minneapolis': 25.80,
  'national': 22.40,
};

// ─── PRODUCTION RATES ────────────────────────────────────────────
// Physical constants: sqft per painter-hour (2-coat basis) or hours per item

const PRODUCTION = {
  // Interior area rates (sqft/hr per painter)
  interior_walls: 150,
  interior_ceiling: 120,
  interior_primer: 200,

  // Interior item rates (hours per item per painter)
  interior_items: {
    'Door - Frame Standard': 0.30,
    'Door - Frame Double': 0.45,
    'Door - Flat': 0.40,
    'Door - w/ Panels': 0.55,
    'Door - w/ Glass': 0.60,
    'Window - Standard Frame': 0.45,
    'Window - Small Frame': 0.30,
    'Trim - Baseboard/Crown': 0.50,
    'Trim - Wainscotting': 1.20,
    'Trim - Spindles/Balusters': 2.50,
    'Trim - Radiator': 0.60,
    'Trim - Handrail': 0.40,
    'Repair - Drywall Repair': 0.75,
  } as Record<string, number>,

  // Exterior area rates (sqft/hr per painter)
  exterior_siding: {
    'Cedar Shingles': 120,
    'Clapboard': 180,
    'HardieBoard': 180,
    'PVC Siding': 200,
    'Decking': 150,
  } as Record<string, number>,

  // Exterior item rates (hours per item per painter)
  exterior_items: {
    // Doors
    'Standard Frame': 0.75,
    'Double Frame': 1.00,
    'w/Glass': 0.80,
    'w/Panels': 0.75,
    'Metal': 0.60,
    'High Gloss': 0.90,
    'Bulkhead': 0.80,
    'Garage': 1.50,
    // Windows
    'Standard': 0.50,
    'Non-Standard': 0.65,
    'Dormer': 0.65,
    'Bay': 0.75,
    'Shutters': 0.35,
    'Basement': 0.30,
    // Trim
    'Fascia (10ft)': 0.45,
    'Dentil Molding': 0.60,
    'Downspout': 0.25,
    'Column': 0.75,
    'Soffit (10ft)': 0.55,
    'Spindles (10ft)': 2.50,
    'Staircase': 1.50,
    'Handrail': 0.45,
    'Fencing (10ft)': 0.80,
    'Dormer Fascia': 0.55,
    'Porch Ceiling': 1.20,
    'Ornate': 2.00,
    // Carpentry repairs
    'Cedar Shingle (1/2 Sq)': 1.50,
    'Cedar Shingle (1 Sq)': 2.50,
    'Clapboard': 0.80,
    'Fascia Board (8ft)': 0.60,
    'Molding (8ft)': 0.50,
    'Window Sill': 0.60,
    'Window Frame': 0.80,
    'Window Flashing': 0.45,
    'Spindle': 0.40,
    'Newel Post': 1.20,
    'Handrail Assy': 1.80,
    'Deck Board (12ft)': 0.50,
    'Deck Board Premium': 0.60,
  } as Record<string, number>,

  // Setup time per exterior surface (flat hours per crew)
  exterior_setup_per_surface: 1.0,

  // Epoxy production rates (sqft/hr per operator, or lf/hr for cove)
  epoxy: {
    coating: 150,              // squeegee + roller application
    existing_coating_removal: 40,
    moisture_mitigation: 80,
    flake_standard: 200,
    flake_full: 120,
    flake_metallic: 120,
    concrete_grinding_light: 60,
    concrete_grinding_heavy: 35,
    crack_repair_minor: 50,
    crack_repair_major: 30,
    cove_base: 15,             // linear feet per hour
  } as Record<string, number>,
};

// ─── COMPLEXITY FACTORS ──────────────────────────────────────────
// Skill premium multipliers: brush/detail work commands higher $/hr than roller.
// Back-calculated from RP rate tables. Applied to crew_wage when pricing items.
// These are the "baked-in" factors for GQ tier. Pro tier lets contractors adjust.

// How complexity factors were derived (for reference):
// For area items: factor = (v1_rate_per_sqft × sqft/hr) / crew_wage × (1 - margin)
// For discrete items: factor = v1_sales_price / (item_hours × crew_wage / (1 - margin))
// where crew_wage=$27, margin=0.455 (matching v1's 1.1x multiplier)
// Then validated by running both engines on identical scope.

const COMPLEXITY = {
  interior: {
    walls: 1.00,       // baseline (roller) — $0.33/sqft × 150/27 × 0.545 = 1.00 ✓
    ceiling: 0.666,    // ceilings are simpler despite being slower — v1 rate $0.275/sqft
    primer: 0.711,     // straightforward single-coat — v1 rate $0.176/sqft
    'Door - Frame Standard': 2.78,
    'Door - Frame Double': 2.78,
    'Door - Flat': 3.12,
    'Door - w/ Panels': 3.08,
    'Door - w/ Glass': 2.78,
    'Window - Standard Frame': 3.71,
    'Window - Small Frame': 4.17,
    'Trim - Baseboard/Crown': 2.50,
    'Trim - Wainscotting': 2.78,
    'Trim - Spindles/Balusters': 2.55,
    'Trim - Radiator': 2.78,
    'Trim - Handrail': 3.12,
    'Repair - Drywall Repair': 2.26,
  } as Record<string, number>,
  exterior_siding: {
    'Cedar Shingles': 7.99,
    'Clapboard': 9.99,
    'HardieBoard': 7.99,
    'PVC Siding': 7.77,
    'Decking': 8.33,
  } as Record<string, number>,
  exterior: {
    // Doors
    'Standard Frame': 2.22,
    'Double Frame': 2.50,
    'w/Glass': 2.78,
    'w/Panels': 2.66,
    'Metal': 2.41,
    'High Gloss': 3.08,
    'Bulkhead': 4.16,
    'Garage': 2.96,
    // Windows
    'Standard': 3.33,
    'Non-Standard': 3.42,
    'Dormer': 4.27,
    'Bay': 4.44,
    'Shutters': 3.17,
    'Basement': 2.96,
    // Trim
    'Fascia (10ft)': 3.70,
    'Dentil Molding': 3.70,
    'Downspout': 3.55,
    'Column': 4.44,
    'Soffit (10ft)': 4.04,
    'Spindles (10ft)': 2.54,
    'Staircase': 3.70,
    'Handrail': 3.70,
    'Fencing (10ft)': 3.47,
    'Dormer Fascia': 4.04,
    'Porch Ceiling': 3.70,
    'Ornate': 3.33,
    // Carpentry repairs
    'Cedar Shingle (1/2 Sq)': 3.70,
    'Cedar Shingle (1 Sq)': 4.00,
    'Clapboard': 4.16,  // carpentry repair Clapboard (siding uses exterior_siding lookup)
    'Fascia Board (8ft)': 3.70,
    'Molding (8ft)': 3.55,
    'Window Sill': 3.70,
    'Window Frame': 4.16,
    'Window Flashing': 3.95,
    'Spindle': 2.78,
    'Newel Post': 3.70,
    'Handrail Assy': 3.70,
    'Deck Board (12ft)': 3.55,
    'Deck Board Premium': 4.44,
  } as Record<string, number>,
};

// Epoxy complexity factors — epoxy work commands a massive premium over painting:
// specialized equipment, technical skill (mixing ratios, temp control), no re-do tolerance.
const COMPLEXITY_EPOXY = {
  'Standard Epoxy': 15.14,
  'Premium Epoxy': 25.74,
  'Polyurea': 22.71,
  'Polyaspartic': 25.74,
  existing_coating_removal: 2.42,
  moisture_mitigation: 3.63,
  flake_standard: 4.04,
  flake_full: 4.84,
  flake_metallic: 7.27,
  concrete_grinding_light: 1.82,
  concrete_grinding_heavy: 2.47,
  crack_repair_minor: 2.02,
  crack_repair_major: 2.42,
  cove_base: 3.63,
} as Record<string, number>;

// Epoxy condition modifier — bad floors are slower to prep
const EPOXY_CONDITION_MOD: Record<string, number> = { Good: 1.0, Fair: 0.87, Poor: 0.74 };
// Note: v1 uses 1.0/1.15/1.35 as PRICE multipliers. In bottom-up, bad condition = slower = 1/1.15=0.87

// ─── CONDITION MODIFIERS ─────────────────────────────────────────
// Bad conditions = slower production = more hours = higher cost

const CONDITION_MODIFIERS = {
  surface_grade: { A: 1.00, B: 1.00, C: 0.85, D: 0.70 } as Record<string, number>,
  prep_level: { Basic: 1.10, Standard: 1.00, Superior: 0.80, Restoration: 0.60 } as Record<string, number>,
};

// ─── WALL SQFT LOOKUP (shared with pricing.ts) ──────────────────
const WALL_SQFT: Record<string, Record<string, number>> = {
  'Kitchen':            { Small: 240, Medium: 416, Large: 512 },
  'Living Room':        { Small: 480, Medium: 576, Large: 800 },
  'Bedroom':            { Small: 320, Medium: 384, Large: 420 },
  'Master Bedroom':     { Small: 416, Medium: 544, Large: 640 },
  'Dining Room':        { Small: 352, Medium: 448, Large: 512 },
  'Bathroom':           { Small: 176, Medium: 256, Large: 304 },
  'Full Bathroom':      { Small: 240, Medium: 272, Large: 320 },
  'Foyer/Hallway':      { Small: 192, Medium: 256, Large: 368 },
  'Closet':             { Small: 80,  Medium: 96,  Large: 128 },
  'Den':                { Small: 320, Medium: 384, Large: 480 },
  'Office':             { Small: 372, Medium: 416, Large: 512 },
  'Media Room':         { Small: 276, Medium: 448, Large: 544 },
  'Eating Area':        { Small: 320, Medium: 384, Large: 512 },
  'Pantry':             { Small: 64,  Medium: 112, Large: 168 },
  'Laundry Room':       { Small: 144, Medium: 224, Large: 372 },
  'Utility/Mud Room':   { Small: 176, Medium: 224, Large: 372 },
  'Recreation Room':    { Small: 480, Medium: 640, Large: 768 },
  'Family Room':        { Small: 448, Medium: 544, Large: 640 },
  'Staircase Hallway':  { Small: 296, Medium: 576, Large: 864 },
};

const CEILING_RATIO: Record<string, number> = {
  'Kitchen': 0.50, 'Living Room': 0.40, 'Bedroom': 0.45, 'Master Bedroom': 0.40,
  'Dining Room': 0.45, 'Bathroom': 0.55, 'Full Bathroom': 0.50, 'Foyer/Hallway': 0.35,
  'Closet': 0.60, 'Den': 0.45, 'Office': 0.45, 'Media Room': 0.40,
  'Eating Area': 0.45, 'Pantry': 0.55, 'Laundry Room': 0.50, 'Utility/Mud Room': 0.50,
  'Recreation Room': 0.35, 'Family Room': 0.40, 'Staircase Hallway': 0.30,
};

const CLOSET_SQFT: Record<string, number> = { small: 48, medium: 64, large: 96 };

// ─── PAINT PRODUCTS ─────────────────────────────────────────────
const INTERIOR_PAINT = {
  walls:   { product: 'Regal Select Eggshell',   coverage: 350, price_per_gallon: 63.59 },
  trim:    { product: 'Regal Select Semi Gloss',  coverage: 350, price_per_gallon: 63.59 },
  primer:  { product: 'Fresh Start',              coverage: 400, price_per_gallon: 44.99 },
  ceiling: { product: 'Ben Moore Muresco',         coverage: 400, price_per_gallon: 40.78 },
};

const EXTERIOR_PAINT = {
  trim:   { product: 'Moorgard Soft Gloss', coverage: 300, price_per_gallon: 69.59 },
  siding: { product: 'Moorgard Low Lustre', coverage: 300, price_per_gallon: 69.59 },
};

// ─── SQFT PER UNIT (for material calculations) ──────────────────
const INTERIOR_ITEM_SQFT: Record<string, number> = {
  'Window - Standard Frame': 15, 'Window - Small Frame': 25,
  'Door - Frame Standard': 8, 'Door - Frame Double': 12,
  'Door - Flat': 21, 'Door - w/ Panels': 21, 'Door - w/ Glass': 21,
  'Trim - Baseboard/Crown': 20, 'Trim - Wainscotting': 60,
  'Trim - Spindles/Balusters': 430, 'Trim - Radiator': 22,
  'Trim - Handrail': 10, 'Repair - Drywall Repair': 50,
};

const EXTERIOR_ITEM_SQFT: Record<string, Record<string, number>> = {
  siding: { 'Cedar Shingles': 200, 'Clapboard': 200, 'HardieBoard': 200, 'PVC Siding': 200, 'Decking': 200 },
  doors: { 'Standard Frame': 21, 'Double Frame': 42, 'w/Glass': 21, 'w/Panels': 21, 'Metal': 21, 'High Gloss': 21, 'Bulkhead': 30, 'Garage': 160 },
  windows: { 'Standard': 15, 'Non-Standard': 20, 'Dormer': 25, 'Bay': 30, 'Shutters': 12, 'Basement': 8 },
  trim: { 'Fascia (10ft)': 20, 'Dentil Molding': 10, 'Downspout': 8, 'Column': 30, 'Soffit (10ft)': 30, 'Spindles (10ft)': 430, 'Staircase': 60, 'Handrail': 10, 'Fencing (10ft)': 40, 'Dormer Fascia': 20, 'Porch Ceiling': 80, 'Ornate': 40 },
  carpentry_repairs: { 'Cedar Shingle (1/2 Sq)': 100, 'Cedar Shingle (1 Sq)': 200, 'Clapboard': 32, 'Fascia Board (8ft)': 8, 'Molding (8ft)': 8, 'Window Sill': 4, 'Window Frame': 12, 'Window Flashing': 6, 'Spindle': 2, 'Newel Post': 8, 'Handrail Assy': 20, 'Deck Board (12ft)': 12, 'Deck Board Premium': 12 },
};

const CARPENTRY_MATERIAL_PRICES: Record<string, number> = {
  'Cedar Shingle (1/2 Sq)': 150, 'Cedar Shingle (1 Sq)': 275, 'Clapboard': 45,
  'Fascia Board (8ft)': 30, 'Molding (8ft)': 25, 'Window Sill': 35,
  'Window Frame': 55, 'Window Flashing': 20, 'Spindle': 18,
  'Newel Post': 85, 'Handrail Assy': 120, 'Deck Board (12ft)': 30, 'Deck Board Premium': 55,
};

// ─── SURCHARGES ─────────────────────────────────────────────────
const FIXED_SURCHARGES = {
  color_samples: 98.95,
  cc_pct: 0.032,
  transportation: 50,
  trash_interior: 50,
  trash_exterior: 225,
};

// ─── BENCHMARKS ─────────────────────────────────────────────────
const INTERIOR_BENCHMARKS = {
  overall: priceBenchmarks.interior,
  by_rooms: priceBenchmarks.interior_by_rooms as Record<string, { p25: number; p50: number; p75: number; mean: number; n: number }>,
};

const EXTERIOR_BENCHMARKS = {
  overall: priceBenchmarks.exterior,
  by_surfaces: priceBenchmarks.exterior_by_surfaces as Record<string, { p25: number; p50: number; p75: number; mean: number; n: number }>,
};

// ─── HELPER: resolve tenant pricing settings ────────────────────

interface BottomUpSettings {
  crew_wage: number;
  crew_size: number;
  gross_margin: number;
}

export function resolveSettings(tenant: TenantConfig): BottomUpSettings {
  const wage = tenant.crew_hourly_wage
    ?? METRO_WAGES[tenant.metro_area ?? '']
    ?? METRO_WAGES.national;

  return {
    crew_wage: wage,
    crew_size: tenant.default_crew_size ?? 2,
    gross_margin: tenant.target_gross_margin ?? 0.40,
  };
}

// ─── CORE FORMULA ───────────────────────────────────────────────
// hours × wage = labor_cost
// labor_cost / (1 - margin) = sales_price (for labor portion)
// sub_cost = labor_cost (what a sub would charge, before their own margin)

function priceFromHours(
  hours: number,
  wage: number,
  margin: number,
  complexityFactor: number = 1.0,
): { sub_cost: number; sales_price: number } {
  const laborCost = hours * wage * complexityFactor;
  const salesPrice = laborCost / (1 - margin);
  return { sub_cost: laborCost, sales_price: salesPrice };
}

// ═══════════════════════════════════════════════════════════════
// INTERIOR — BOTTOM-UP
// ═══════════════════════════════════════════════════════════════

export function calculateInteriorBottomUp(
  formData: InteriorScopeData,
  _catalog: CatalogConfig,
  tenant: TenantConfig,
): QuoteResult {
  const settings = resolveSettings(tenant);
  const { crew_wage, gross_margin } = settings;

  // Condition modifiers affect production speed
  const gradeMod = CONDITION_MODIFIERS.surface_grade[formData.project.surface_grade] ?? 1.0;
  const prepMod = CONDITION_MODIFIERS.prep_level[formData.project.prep_level] ?? 1.0;
  const conditionMod = gradeMod * prepMod;

  const sections: SectionResult[] = [];
  let totalSubCost = 0;
  let totalSalesPrice = 0;
  let totalPainterHours = 0;
  let totalWallSqft = 0;
  let totalCeilingSqft = 0;
  let totalTrimSqft = 0;
  let totalPrimerSqft = 0;

  for (const room of formData.rooms) {
    const wallSqft = WALL_SQFT[room.room_type]?.[room.room_size] || 300;
    const ceilingRatio = CEILING_RATIO[room.room_type] || 0.45;
    const ceilingSqft = room.ceiling_included ? Math.round(wallSqft * ceilingRatio) : 0;
    const items: LineItem[] = [];

    // Walls
    const wallHours = (wallSqft / PRODUCTION.interior_walls) / conditionMod;
    const wallPrice = priceFromHours(wallHours, crew_wage, gross_margin, COMPLEXITY.interior.walls);
    items.push({
      label: `Walls (${wallSqft} sqft)`,
      quantity: 1,
      sub_cost: wallPrice.sub_cost,
      sales_price: wallPrice.sales_price,
      allocated_time: wallHours,
    });
    totalWallSqft += wallSqft;

    // Ceiling
    if (room.ceiling_included) {
      const ceilHours = (ceilingSqft / PRODUCTION.interior_ceiling) / conditionMod;
      const ceilPrice = priceFromHours(ceilHours, crew_wage, gross_margin, COMPLEXITY.interior.ceiling);
      items.push({
        label: `Ceiling (${ceilingSqft} sqft)`,
        quantity: 1,
        sub_cost: ceilPrice.sub_cost,
        sales_price: ceilPrice.sales_price,
        allocated_time: ceilHours,
      });
      totalCeilingSqft += ceilingSqft;
    }

    // Closet
    if (room.closet !== 'not_included') {
      const closetSqft = CLOSET_SQFT[room.closet] || 0;
      const closetHours = (closetSqft / PRODUCTION.interior_walls) / conditionMod;
      const closetPrice = priceFromHours(closetHours, crew_wage, gross_margin, COMPLEXITY.interior.walls);
      items.push({
        label: `Closet (${room.closet})`,
        quantity: 1,
        sub_cost: closetPrice.sub_cost,
        sales_price: closetPrice.sales_price,
        allocated_time: closetHours,
      });
      totalWallSqft += closetSqft;
    }

    // Primer
    if (room.primer_required) {
      const primerSqft = wallSqft + ceilingSqft;
      totalPrimerSqft += primerSqft;
      const primerHours = (primerSqft / PRODUCTION.interior_primer) / conditionMod;
      const primerPrice = priceFromHours(primerHours, crew_wage, gross_margin, COMPLEXITY.interior.primer ?? 0.70);
      items.push({
        label: `Primer (${primerSqft} sqft)`,
        quantity: 1,
        sub_cost: primerPrice.sub_cost,
        sales_price: primerPrice.sales_price,
        allocated_time: primerHours,
      });
    }

    // Line items (doors, windows, trim, repairs)
    for (const [itemName, qty] of Object.entries(room.items)) {
      if (qty <= 0) continue;
      const itemHoursEach = PRODUCTION.interior_items[itemName];
      if (itemHoursEach === undefined) continue;

      const totalItemHours = (itemHoursEach * qty) / conditionMod;
      const cf = COMPLEXITY.interior[itemName] ?? 1.5;
      const itemPrice = priceFromHours(totalItemHours, crew_wage, gross_margin, cf);

      items.push({
        label: itemName,
        quantity: qty,
        sub_cost: itemPrice.sub_cost,
        sales_price: itemPrice.sales_price,
        allocated_time: totalItemHours,
      });

      if (itemName.startsWith('Trim') || itemName.startsWith('Door') || itemName.startsWith('Window')) {
        totalTrimSqft += (INTERIOR_ITEM_SQFT[itemName] ?? 0) * qty;
      }
    }

    const sectionSubCost = items.reduce((s, i) => s + i.sub_cost, 0);
    const sectionSalesPrice = items.reduce((s, i) => s + i.sales_price, 0);
    const sectionTime = items.reduce((s, i) => s + i.allocated_time, 0);

    sections.push({
      label: `${room.room_type} (${room.room_size})`,
      items,
      sub_cost: sectionSubCost,
      sales_price: sectionSalesPrice,
    });

    totalSubCost += sectionSubCost;
    totalSalesPrice += sectionSalesPrice;
    totalPainterHours += sectionTime;
  }

  // ─── SURCHARGES ─────────────────────────────────────────────
  // In bottom-up, surcharges are flat costs (not % of labor) since
  // the margin is already embedded in each line item.
  const surcharges: { label: string; sub_amount: number; sales_amount: number }[] = [];

  if (formData.project.color_samples) {
    surcharges.push({ label: 'Color Samples', sub_amount: FIXED_SURCHARGES.color_samples, sales_amount: FIXED_SURCHARGES.color_samples });
  }
  if (formData.project.transportation) {
    surcharges.push({ label: 'Transportation', sub_amount: FIXED_SURCHARGES.transportation, sales_amount: FIXED_SURCHARGES.transportation });
  }
  surcharges.push({ label: 'Trash Removal', sub_amount: FIXED_SURCHARGES.trash_interior, sales_amount: FIXED_SURCHARGES.trash_interior });

  const surchargeSubTotal = surcharges.reduce((s, sc) => s + sc.sub_amount, 0);
  const surchargeSalesTotal = surcharges.reduce((s, sc) => s + sc.sales_amount, 0);

  const laborTotal = totalSalesPrice + surchargeSalesTotal;

  // ─── MATERIALS ──────────────────────────────────────────────
  const materials: { label: string; gallons: number; cost: number }[] = [];

  const wallGallons = Math.ceil(totalWallSqft / INTERIOR_PAINT.walls.coverage);
  if (wallGallons > 0) {
    materials.push({ label: INTERIOR_PAINT.walls.product, gallons: wallGallons, cost: wallGallons * INTERIOR_PAINT.walls.price_per_gallon });
  }
  const trimGallons = Math.ceil(totalTrimSqft / INTERIOR_PAINT.trim.coverage);
  if (trimGallons > 0) {
    materials.push({ label: INTERIOR_PAINT.trim.product, gallons: trimGallons, cost: trimGallons * INTERIOR_PAINT.trim.price_per_gallon });
  }
  if (totalPrimerSqft > 0) {
    const primerGallons = Math.ceil(totalPrimerSqft / INTERIOR_PAINT.primer.coverage);
    materials.push({ label: INTERIOR_PAINT.primer.product, gallons: primerGallons, cost: primerGallons * INTERIOR_PAINT.primer.price_per_gallon });
  }
  if (totalCeilingSqft > 0) {
    const ceilingGallons = Math.ceil(totalCeilingSqft / INTERIOR_PAINT.ceiling.coverage);
    materials.push({ label: INTERIOR_PAINT.ceiling.product, gallons: ceilingGallons, cost: ceilingGallons * INTERIOR_PAINT.ceiling.price_per_gallon });
  }

  const materialSubtotal = materials.reduce((s, m) => s + m.cost, 0);
  const wastage = materialSubtotal * 0.10;
  const materialsTotal = materialSubtotal + wastage;

  // CC surcharge on grand total
  const grandBeforeCC = laborTotal + materialsTotal;
  const ccFee = grandBeforeCC * FIXED_SURCHARGES.cc_pct;
  surcharges.push({ label: `CC Fee (${(FIXED_SURCHARGES.cc_pct * 100).toFixed(1)}%)`, sub_amount: ccFee, sales_amount: ccFee });

  const grandTotal = grandBeforeCC + ccFee;

  // ─── PRODUCTION ─────────────────────────────────────────────
  const paintingHours = totalPainterHours;
  const crewSize = settings.crew_size || (paintingHours > 48 ? 3 : 2);
  const durationDays = Math.max(paintingHours / crewSize / 8, 0.5);

  // ─── PROFITABILITY ──────────────────────────────────────────
  const laborIncome = laborTotal;
  const materialIncome = materialsTotal;
  const totalPrice = laborIncome + materialIncome;
  const laborExpense = totalSubCost + surchargeSubTotal;
  const materialExpense = materialsTotal * 0.80;
  const grossProfit = totalPrice - laborExpense - materialExpense;
  const tax = grossProfit * 0.25;
  const overheads = grossProfit * 0.12;
  const netProfit = grossProfit - tax - overheads;

  // ─── BENCHMARKS ─────────────────────────────────────────────
  let benchmarks: { percentile: string; message: string; win_rate?: string } | undefined;
  const roomCount = formData.rooms.length;
  const benchmarkKey = roomCount <= 2 ? '1-2' : roomCount <= 4 ? '3-4' : roomCount <= 7 ? '5-7' : '8+';
  const roomBench = INTERIOR_BENCHMARKS.by_rooms[benchmarkKey];
  const overall = INTERIOR_BENCHMARKS.overall;
  if (overall) {
    let label: string;
    let msg: string;
    if (grandTotal < overall.p25) {
      label = 'below-average';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is priced below most ${roomCount}-room interior jobs. Make sure your scope is complete.`;
    } else if (grandTotal < overall.p50) {
      label = 'competitive';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is competitively priced for a ${roomCount}-room interior job.`;
    } else if (grandTotal < overall.p75) {
      label = 'mid-range';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is in the typical range for a ${roomCount}-room interior job.`;
    } else {
      label = 'premium';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is a premium estimate for a ${roomCount}-room interior job. Justified if scope or conditions warrant it.`;
    }
    if (roomBench) {
      msg += ` Median for ${benchmarkKey} room jobs: $${Math.round(roomBench.p50).toLocaleString()}.`;
    }
    const winKey = grandTotal < 3000 ? 'lt3K' : grandTotal < 7000 ? '3-7K' : grandTotal < 15000 ? '7-15K' : '15Kplus';
    const wr = priceBenchmarks.win_rates[winKey as keyof typeof priceBenchmarks.win_rates];
    const winRateNote = wr ? `Jobs in this price range close at ~${Math.round(wr.win_rate)}%.` : undefined;
    benchmarks = { percentile: label, message: msg, win_rate: winRateNote };
  }

  // ─── COMPLETENESS WARNINGS ──────────────────────────────────
  const completenessWarnings: string[] = [];
  const hasTrim = formData.rooms.some(r => Object.entries(r.items).some(([k, v]) => k.startsWith('Trim') && v > 0));
  const hasDoors = formData.rooms.some(r => Object.entries(r.items).some(([k, v]) => k.startsWith('Door') && v > 0));
  const hasWindows = formData.rooms.some(r => Object.entries(r.items).some(([k, v]) => k.startsWith('Window') && v > 0));
  const hasCeiling = formData.rooms.some(r => r.ceiling_included);

  for (const rule of scopeCheckerRules.interior.item_frequencies) {
    if (rule.frequency < 15) continue;
    if (rule.col === 'has_trim' && !hasTrim && roomCount >= 2) {
      completenessWarnings.push(`${Math.round(rule.frequency)}% of interior jobs include trim work. Did you check for baseboard or crown trim?`);
    } else if (rule.col === 'total_doors' && !hasDoors && roomCount >= 2) {
      completenessWarnings.push(`${Math.round(rule.frequency)}% of interior jobs include door painting${rule.avg_when_present ? ` (avg ${Math.round(rule.avg_when_present)} doors)` : ''}. Did you check?`);
    } else if (rule.col === 'total_windows' && !hasWindows && roomCount >= 3) {
      completenessWarnings.push(`${Math.round(rule.frequency)}% of interior jobs include window painting. Did you check for window trim?`);
    } else if (rule.col === 'has_ceiling' && !hasCeiling && roomCount >= 3) {
      completenessWarnings.push(`${Math.round(rule.frequency)}% of interior jobs include ceiling painting. Did you check?`);
    }
  }

  return {
    trade_type: 'interior',
    sections,
    labor_subtotal: totalSalesPrice,
    surcharges,
    labor_total: laborTotal + ccFee,
    materials,
    materials_total: materialsTotal,
    grand_total: grandTotal,
    production: { painting_hours: paintingHours, crew_size: crewSize, duration_days: durationDays },
    profitability: { labor_income: laborIncome, material_income: materialIncome, total_price: totalPrice, labor_expense: laborExpense, material_expense: materialExpense, gross_profit: grossProfit, tax, overheads, net_profit: netProfit },
    benchmarks,
    completeness_warnings: completenessWarnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXTERIOR — BOTTOM-UP
// ═══════════════════════════════════════════════════════════════

export function calculateExteriorBottomUp(
  formData: ExteriorScopeData,
  _catalog: CatalogConfig,
  tenant: TenantConfig,
): QuoteResult {
  const settings = resolveSettings(tenant);
  const { crew_wage, gross_margin } = settings;

  const gradeMod = CONDITION_MODIFIERS.surface_grade[formData.project.surface_grade] ?? 1.0;
  const prepMod = CONDITION_MODIFIERS.prep_level[formData.project.prep_level] ?? 1.0;
  const conditionMod = gradeMod * prepMod;

  const sections: SectionResult[] = [];
  let totalSubCost = 0;
  let totalSalesPrice = 0;
  let totalPainterHours = 0;
  let totalSidingSqft = 0;
  let totalTrimSqft = 0;
  let totalCarpentryMaterials = 0;

  for (const surface of formData.surfaces) {
    const items: LineItem[] = [];

    // Setup time per surface (flat, per crew)
    const setupHours = PRODUCTION.exterior_setup_per_surface;
    const setupPrice = priceFromHours(setupHours, crew_wage, gross_margin, 1.0);
    items.push({
      label: 'Setup & Staging',
      quantity: 1,
      sub_cost: setupPrice.sub_cost,
      sales_price: setupPrice.sales_price,
      allocated_time: setupHours,
    });

    // Process each category of items on this surface
    const categories = ['siding', 'doors', 'windows', 'trim', 'carpentry_repairs'] as const;

    for (const category of categories) {
      const surfaceItems = (surface as any)[category] as Record<string, number> | undefined;
      if (!surfaceItems) continue;

      for (const [itemName, qty] of Object.entries(surfaceItems)) {
        if (qty <= 0) continue;

        let itemHoursEach: number;
        let cf: number;

        if (category === 'siding') {
          // Area-based: use siding production rate
          const sqftPerUnit = EXTERIOR_ITEM_SQFT.siding?.[itemName] ?? 200;
          const sidingRate = PRODUCTION.exterior_siding[itemName] ?? 180;
          itemHoursEach = (sqftPerUnit / sidingRate);
          cf = COMPLEXITY.exterior_siding[itemName] ?? 8.0;
          totalSidingSqft += sqftPerUnit * qty;
        } else {
          // Discrete items
          itemHoursEach = PRODUCTION.exterior_items[itemName] ?? 0.50;
          cf = COMPLEXITY.exterior[itemName] ?? 1.5;

          const sqft = EXTERIOR_ITEM_SQFT[category]?.[itemName] ?? 0;
          if (category === 'trim' || category === 'doors' || category === 'windows') {
            totalTrimSqft += sqft * qty;
          }
          if (category === 'carpentry_repairs') {
            const matPrice = CARPENTRY_MATERIAL_PRICES[itemName] ?? 0;
            totalCarpentryMaterials += matPrice * qty * 0.75;
          }
        }

        const totalItemHours = (itemHoursEach * qty) / conditionMod;
        const itemPrice = priceFromHours(totalItemHours, crew_wage, gross_margin, cf);

        items.push({
          label: itemName,
          quantity: qty,
          sub_cost: itemPrice.sub_cost,
          sales_price: itemPrice.sales_price,
          allocated_time: totalItemHours,
        });
      }
    }

    const sectionSubCost = items.reduce((s, i) => s + i.sub_cost, 0);
    const sectionSalesPrice = items.reduce((s, i) => s + i.sales_price, 0);
    const sectionTime = items.reduce((s, i) => s + i.allocated_time, 0);

    sections.push({ label: surface.name, items, sub_cost: sectionSubCost, sales_price: sectionSalesPrice });
    totalSubCost += sectionSubCost;
    totalSalesPrice += sectionSalesPrice;
    totalPainterHours += sectionTime;
  }

  // ─── SURCHARGES ─────────────────────────────────────────────
  const surcharges: { label: string; sub_amount: number; sales_amount: number }[] = [];

  // Exterior surcharges: staging and color scheme affect hours via condition modifier,
  // not as percentage surcharges. So we only add fixed surcharges here.
  if (formData.project.color_samples) {
    surcharges.push({ label: 'Color Samples', sub_amount: FIXED_SURCHARGES.color_samples, sales_amount: FIXED_SURCHARGES.color_samples });
  }
  surcharges.push({ label: 'Transportation', sub_amount: FIXED_SURCHARGES.transportation, sales_amount: FIXED_SURCHARGES.transportation });
  surcharges.push({ label: 'Trash Removal', sub_amount: FIXED_SURCHARGES.trash_exterior, sales_amount: FIXED_SURCHARGES.trash_exterior });

  // Staging surcharge — in bottom-up this is additional hours, not a % markup
  if (formData.project.staging) {
    const stagingHours = totalPainterHours * 0.10; // 10% more time for staging
    const stagingPrice = priceFromHours(stagingHours, crew_wage, gross_margin, 1.0);
    surcharges.push({ label: 'Staging', sub_amount: stagingPrice.sub_cost, sales_amount: stagingPrice.sales_price });
    totalPainterHours += stagingHours;
  }

  // Color scheme complexity — more colors = more masking time
  if (formData.project.color_scheme === '3 Colors') {
    const colorHours = totalPainterHours * 0.05;
    const colorPrice = priceFromHours(colorHours, crew_wage, gross_margin, 1.0);
    surcharges.push({ label: '3-Color Scheme', sub_amount: colorPrice.sub_cost, sales_amount: colorPrice.sales_price });
    totalPainterHours += colorHours;
  } else if (formData.project.color_scheme === '4 Colors') {
    const colorHours = totalPainterHours * 0.08;
    const colorPrice = priceFromHours(colorHours, crew_wage, gross_margin, 1.0);
    surcharges.push({ label: '4-Color Scheme', sub_amount: colorPrice.sub_cost, sales_amount: colorPrice.sales_price });
    totalPainterHours += colorHours;
  }

  const surchargeSubTotal = surcharges.reduce((s, sc) => s + sc.sub_amount, 0);
  const surchargeSalesTotal = surcharges.reduce((s, sc) => s + sc.sales_amount, 0);
  const laborTotal = totalSalesPrice + surchargeSalesTotal;

  // ─── MATERIALS ──────────────────────────────────────────────
  const materials: { label: string; gallons: number; cost: number }[] = [];

  const sidingGallons = Math.ceil(totalSidingSqft / EXTERIOR_PAINT.siding.coverage);
  if (sidingGallons > 0) {
    materials.push({ label: EXTERIOR_PAINT.siding.product, gallons: sidingGallons, cost: sidingGallons * EXTERIOR_PAINT.siding.price_per_gallon });
  }
  const trimGallons = Math.ceil(totalTrimSqft / EXTERIOR_PAINT.trim.coverage);
  if (trimGallons > 0) {
    materials.push({ label: EXTERIOR_PAINT.trim.product, gallons: trimGallons, cost: trimGallons * EXTERIOR_PAINT.trim.price_per_gallon });
  }
  if (totalCarpentryMaterials > 0) {
    materials.push({ label: 'Carpentry Materials', gallons: 0, cost: totalCarpentryMaterials });
  }

  const materialSubtotal = materials.reduce((s, m) => s + m.cost, 0);
  const wastage = materialSubtotal * 0.10;
  const materialsTotal = materialSubtotal + wastage;

  // CC fee
  const grandBeforeCC = laborTotal + materialsTotal;
  const ccFee = grandBeforeCC * FIXED_SURCHARGES.cc_pct;
  surcharges.push({ label: `CC Fee (${(FIXED_SURCHARGES.cc_pct * 100).toFixed(1)}%)`, sub_amount: ccFee, sales_amount: ccFee });

  const grandTotal = grandBeforeCC + ccFee;

  // ─── PRODUCTION ─────────────────────────────────────────────
  const paintingHours = totalPainterHours;
  const crewSize = settings.crew_size || (paintingHours > 24 ? 3 : 2);
  const durationDays = Math.max(paintingHours / crewSize / 8, 0.5);

  // ─── PROFITABILITY ──────────────────────────────────────────
  const laborIncome = laborTotal;
  const materialIncome = materialsTotal;
  const totalPrice = laborIncome + materialIncome;
  const laborExpense = totalSubCost + surchargeSubTotal;
  const materialExpense = materialsTotal * 0.80;
  const grossProfit = totalPrice - laborExpense - materialExpense;
  const tax = grossProfit * 0.25;
  const overheads = grossProfit * 0.12;
  const netProfit = grossProfit - tax - overheads;

  // ─── BENCHMARKS ─────────────────────────────────────────────
  let benchmarks: { percentile: string; message: string; win_rate?: string } | undefined;
  const surfaceCount = formData.surfaces.length;
  const benchKey = surfaceCount <= 2 ? '1-2' : surfaceCount <= 4 ? '3-4' : '5+';
  const surfBench = EXTERIOR_BENCHMARKS.by_surfaces[benchKey];
  const extOverall = EXTERIOR_BENCHMARKS.overall;
  if (extOverall) {
    let label: string;
    let msg: string;
    if (grandTotal < extOverall.p25) {
      label = 'below-average';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is priced below most ${surfaceCount}-surface exterior jobs.`;
    } else if (grandTotal < extOverall.p50) {
      label = 'competitive';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is competitively priced for a ${surfaceCount}-surface exterior job.`;
    } else if (grandTotal < extOverall.p75) {
      label = 'mid-range';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is in the typical range for a ${surfaceCount}-surface exterior job.`;
    } else {
      label = 'premium';
      msg = `At $${Math.round(grandTotal).toLocaleString()}, this is a premium exterior estimate. Justified if scope or conditions warrant it.`;
    }
    if (surfBench) {
      msg += ` Median for ${benchKey} surface jobs: $${Math.round(surfBench.p50).toLocaleString()}.`;
    }
    const winKey = grandTotal < 3000 ? 'lt3K' : grandTotal < 7000 ? '3-7K' : grandTotal < 15000 ? '7-15K' : '15Kplus';
    const wr = priceBenchmarks.win_rates[winKey as keyof typeof priceBenchmarks.win_rates];
    const winRateNote = wr ? `Jobs in this price range close at ~${Math.round(wr.win_rate)}%.` : undefined;
    benchmarks = { percentile: label, message: msg, win_rate: winRateNote };
  }

  // ─── COMPLETENESS ───────────────────────────────────────────
  const completenessWarnings: string[] = [];
  const hasAnyTrim = formData.surfaces.some(s => s.trim && Object.values(s.trim).some(v => v > 0));
  const hasAnyWindows = formData.surfaces.some(s => s.windows && Object.values(s.windows).some(v => v > 0));
  if (!hasAnyTrim && surfaceCount >= 2) {
    completenessWarnings.push('Most exterior jobs include trim work (fascia, soffit, etc.). Did you check?');
  }
  if (!hasAnyWindows && surfaceCount >= 2) {
    completenessWarnings.push('Most exterior jobs include window painting. Did you check?');
  }

  return {
    trade_type: 'exterior',
    sections,
    labor_subtotal: totalSalesPrice,
    surcharges,
    labor_total: laborTotal + ccFee,
    materials,
    materials_total: materialsTotal,
    grand_total: grandTotal,
    production: { painting_hours: paintingHours, crew_size: crewSize, duration_days: durationDays },
    profitability: { labor_income: laborIncome, material_income: materialIncome, total_price: totalPrice, labor_expense: laborExpense, material_expense: materialExpense, gross_profit: grossProfit, tax, overheads, net_profit: netProfit },
    benchmarks,
    completeness_warnings: completenessWarnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// EPOXY — BOTTOM-UP
// ═══════════════════════════════════════════════════════════════

export function calculateEpoxyBottomUp(
  formData: EpoxyScopeData,
  _catalog: CatalogConfig,
  tenant: TenantConfig,
): QuoteResult {
  const settings = resolveSettings(tenant);
  const { crew_wage, gross_margin } = settings;

  const sections: SectionResult[] = [];
  let totalSalesPrice = 0;
  let totalPainterHours = 0;

  for (const floor of formData.floors) {
    const items: LineItem[] = [];
    const condMod = EPOXY_CONDITION_MOD[floor.floor_condition] ?? 1.0;

    // Base coating
    const coatingHours = (floor.sqft / PRODUCTION.epoxy.coating) / condMod;
    const coatingCf = COMPLEXITY_EPOXY[floor.coating_type] ?? 15.14;
    const coatingPrice = priceFromHours(coatingHours, crew_wage, gross_margin, coatingCf);
    items.push({
      label: `${floor.coating_type} (${floor.sqft} sqft, ${floor.floor_condition})`,
      quantity: floor.sqft,
      sub_cost: coatingPrice.sub_cost,
      sales_price: coatingPrice.sales_price,
      allocated_time: coatingHours,
    });

    // Existing coating removal
    if (floor.existing_coating_removal) {
      const hours = (floor.sqft / PRODUCTION.epoxy.existing_coating_removal) / condMod;
      const price = priceFromHours(hours, crew_wage, gross_margin, COMPLEXITY_EPOXY.existing_coating_removal);
      items.push({
        label: 'Existing Coating Removal',
        quantity: floor.sqft,
        sub_cost: price.sub_cost,
        sales_price: price.sales_price,
        allocated_time: hours,
      });
    }

    // Moisture mitigation
    if (floor.moisture_issues) {
      const hours = (floor.sqft / PRODUCTION.epoxy.moisture_mitigation) / condMod;
      const price = priceFromHours(hours, crew_wage, gross_margin, COMPLEXITY_EPOXY.moisture_mitigation);
      items.push({
        label: 'Moisture Mitigation',
        quantity: floor.sqft,
        sub_cost: price.sub_cost,
        sales_price: price.sales_price,
        allocated_time: hours,
      });
    }

    // Flake
    if (floor.color_flake !== 'none') {
      const flakeKey = `flake_${floor.color_flake}`;
      const flakeProdRate = PRODUCTION.epoxy[flakeKey] ?? 200;
      const flakeCf = COMPLEXITY_EPOXY[flakeKey] ?? 4.04;
      const hours = floor.sqft / flakeProdRate;
      const price = priceFromHours(hours, crew_wage, gross_margin, flakeCf);
      items.push({
        label: `${floor.color_flake} Flake`,
        quantity: floor.sqft,
        sub_cost: price.sub_cost,
        sales_price: price.sales_price,
        allocated_time: hours,
      });
    }

    // Cove base
    if (floor.cove_base && floor.cove_base_linear_feet > 0) {
      const hours = floor.cove_base_linear_feet / PRODUCTION.epoxy.cove_base;
      const price = priceFromHours(hours, crew_wage, gross_margin, COMPLEXITY_EPOXY.cove_base);
      items.push({
        label: `Cove Base (${floor.cove_base_linear_feet} lf)`,
        quantity: floor.cove_base_linear_feet,
        sub_cost: price.sub_cost,
        sales_price: price.sales_price,
        allocated_time: hours,
      });
    }

    const sectionSales = items.reduce((s, i) => s + i.sales_price, 0);
    const sectionSub = items.reduce((s, i) => s + i.sub_cost, 0);
    const sectionTime = items.reduce((s, i) => s + i.allocated_time, 0);

    sections.push({
      label: `${floor.area_type} (${floor.sqft} sqft)`,
      items,
      sub_cost: sectionSub,
      sales_price: sectionSales,
    });
    totalSalesPrice += sectionSales;
    totalPainterHours += sectionTime;
  }

  const totalSubCost = sections.reduce((s, sec) => s + sec.sub_cost, 0);

  // Project-level surcharges
  const surcharges: { label: string; sub_amount: number; sales_amount: number }[] = [];
  const totalSqft = formData.floors.reduce((s, f) => s + f.sqft, 0);

  if (formData.project.concrete_grinding) {
    const isHeavy = formData.floors.some(f => f.floor_condition === 'Poor');
    const grindKey = isHeavy ? 'concrete_grinding_heavy' : 'concrete_grinding_light';
    const grindRate = PRODUCTION.epoxy[grindKey];
    const grindCf = COMPLEXITY_EPOXY[grindKey];
    const hours = totalSqft / grindRate;
    const price = priceFromHours(hours, crew_wage, gross_margin, grindCf);
    surcharges.push({ label: 'Concrete Grinding', sub_amount: price.sub_cost, sales_amount: price.sales_price });
    totalPainterHours += hours;
  }

  if (formData.project.crack_repair !== 'none') {
    const crackKey = `crack_repair_${formData.project.crack_repair}`;
    const crackRate = PRODUCTION.epoxy[crackKey];
    const crackCf = COMPLEXITY_EPOXY[crackKey];
    const affectedSqft = totalSqft * (formData.project.crack_repair === 'minor' ? 0.10 : 0.25);
    const hours = affectedSqft / crackRate;
    const price = priceFromHours(hours, crew_wage, gross_margin, crackCf);
    surcharges.push({ label: `Crack Repair (${formData.project.crack_repair})`, sub_amount: price.sub_cost, sales_amount: price.sales_price });
    totalPainterHours += hours;
  }

  surcharges.push({ label: 'Transportation', sub_amount: FIXED_SURCHARGES.transportation, sales_amount: FIXED_SURCHARGES.transportation });

  const surchargeSales = surcharges.reduce((s, sc) => s + sc.sales_amount, 0);
  const surchargeSub = surcharges.reduce((s, sc) => s + sc.sub_amount, 0);

  // Materials
  const materials: { label: string; gallons: number; cost: number }[] = [];
  const epoxyGallons = Math.ceil(totalSqft / 200);
  materials.push({ label: 'Epoxy / Coating', gallons: epoxyGallons, cost: epoxyGallons * 85 });
  if (totalSqft > 0) {
    const primerGallons = Math.ceil(totalSqft / 300);
    materials.push({ label: 'Concrete Primer', gallons: primerGallons, cost: primerGallons * 55 });
  }

  const materialSubtotal = materials.reduce((s, m) => s + m.cost, 0);
  const materialsTotal = materialSubtotal + materialSubtotal * 0.10;

  const laborTotal = totalSalesPrice + surchargeSales;
  const grandTotal = laborTotal + materialsTotal;

  const crewSize = settings.crew_size || 2;
  const durationDays = Math.max(totalPainterHours / crewSize / 8, 1);

  const laborIncome = laborTotal;
  const materialIncome = materialsTotal;
  const totalPrice = laborIncome + materialIncome;
  const laborExpense = totalSubCost + surchargeSub;
  const materialExpense = materialsTotal * 0.80;
  const grossProfit = totalPrice - laborExpense - materialExpense;

  return {
    trade_type: 'epoxy',
    sections,
    labor_subtotal: totalSalesPrice,
    surcharges,
    labor_total: laborTotal,
    materials,
    materials_total: materialsTotal,
    grand_total: grandTotal,
    production: { painting_hours: totalPainterHours, crew_size: crewSize, duration_days: durationDays },
    profitability: {
      labor_income: laborIncome, material_income: materialIncome, total_price: totalPrice,
      labor_expense: laborExpense, material_expense: materialExpense, gross_profit: grossProfit,
      tax: grossProfit * 0.25, overheads: grossProfit * 0.12, net_profit: grossProfit * 0.63,
    },
    completeness_warnings: [],
  };
}
