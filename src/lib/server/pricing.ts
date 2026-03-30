import type { InteriorScopeData, ExteriorScopeData, EpoxyScopeData, QuoteResult, SectionResult, LineItem, CatalogConfig } from '$lib/types/index.js';

const HOURLY_RATE = 40;

// ─── WALL SQFT LOOKUP ───────────────────────────────────────────
const WALL_SQFT: Record<string, Record<string, number>> = {
  "Kitchen":            { Small: 240, Medium: 416, Large: 512 },
  "Living Room":        { Small: 480, Medium: 576, Large: 800 },
  "Bedroom":            { Small: 320, Medium: 384, Large: 420 },
  "Master Bedroom":     { Small: 416, Medium: 544, Large: 640 },
  "Dining Room":        { Small: 352, Medium: 448, Large: 512 },
  "Bathroom":           { Small: 176, Medium: 256, Large: 304 },
  "Full Bathroom":      { Small: 240, Medium: 272, Large: 320 },
  "Foyer/Hallway":      { Small: 192, Medium: 256, Large: 368 },
  "Closet":             { Small: 80,  Medium: 96,  Large: 128 },
  "Den":                { Small: 320, Medium: 384, Large: 480 },
  "Office":             { Small: 372, Medium: 416, Large: 512 },
  "Media Room":         { Small: 276, Medium: 448, Large: 544 },
  "Eating Area":        { Small: 320, Medium: 384, Large: 512 },
  "Pantry":             { Small: 64,  Medium: 112, Large: 168 },
  "Laundry Room":       { Small: 144, Medium: 224, Large: 372 },
  "Utility/Mud Room":   { Small: 176, Medium: 224, Large: 372 },
  "Recreation Room":    { Small: 480, Medium: 640, Large: 768 },
  "Family Room":        { Small: 448, Medium: 544, Large: 640 },
  "Staircase Hallway":  { Small: 296, Medium: 576, Large: 864 },
};

const CEILING_RATIO: Record<string, number> = {
  "Kitchen": 0.50, "Living Room": 0.40, "Bedroom": 0.45, "Master Bedroom": 0.40,
  "Dining Room": 0.45, "Bathroom": 0.55, "Full Bathroom": 0.50, "Foyer/Hallway": 0.35,
  "Closet": 0.60, "Den": 0.45, "Office": 0.45, "Media Room": 0.40,
  "Eating Area": 0.45, "Pantry": 0.55, "Laundry Room": 0.50, "Utility/Mud Room": 0.50,
  "Recreation Room": 0.35, "Family Room": 0.40, "Staircase Hallway": 0.30,
};

// ─── ITEM RATES ─────────────────────────────────────────────────
interface ItemRate { sub_cost: number; sales_price: number; sqft_per_unit: number; }

const INTERIOR_ITEM_RATES: Record<string, ItemRate> = {
  "Window - Standard Frame":   { sub_cost: 50.00,  sales_price: 82.50,  sqft_per_unit: 15 },
  "Window - Small Frame":      { sub_cost: 37.50,  sales_price: 61.88,  sqft_per_unit: 25 },
  "Door - Frame Standard":     { sub_cost: 25.00,  sales_price: 41.25,  sqft_per_unit: 8 },
  "Door - Frame Double":       { sub_cost: 37.50,  sales_price: 61.88,  sqft_per_unit: 12 },
  "Door - Flat":               { sub_cost: 25.00,  sales_price: 61.88,  sqft_per_unit: 21 },
  "Door - w/ Panels":          { sub_cost: 37.50,  sales_price: 83.88,  sqft_per_unit: 21 },
  "Door - w/ Glass":           { sub_cost: 50.00,  sales_price: 82.50,  sqft_per_unit: 21 },
  "Trim - Baseboard/Crown":    { sub_cost: 37.50,  sales_price: 61.88,  sqft_per_unit: 20 },
  "Trim - Wainscotting":       { sub_cost: 75.00,  sales_price: 165.00, sqft_per_unit: 60 },
  "Trim - Spindles/Balusters": { sub_cost: 191.50, sales_price: 315.56, sqft_per_unit: 430 },
  "Trim - Radiator":           { sub_cost: 50.00,  sales_price: 82.50,  sqft_per_unit: 22 },
  "Trim - Handrail":           { sub_cost: 37.50,  sales_price: 61.88,  sqft_per_unit: 10 },
  "Repair - Drywall Repair":   { sub_cost: 25.00,  sales_price: 83.88,  sqft_per_unit: 50 },
};

// ─── CLOSET SQFT ────────────────────────────────────────────────
const CLOSET_SQFT: Record<string, number> = { small: 48, medium: 64, large: 96 };

// ─── SURCHARGES ─────────────────────────────────────────────────
const INTERIOR_SURCHARGES = {
  surface_grade: {
    A: { sub_pct: 0,     sales_pct: 0 },
    B: { sub_pct: 0,     sales_pct: 0 },
    C: { sub_pct: 0.075, sales_pct: 0.10 },
    D: { sub_pct: 0.125, sales_pct: 0.15 },
  } as Record<string, { sub_pct: number; sales_pct: number }>,
  prep_level: {
    Basic:       { sub_pct: -0.075, sales_pct: -0.075 },
    Standard:    { sub_pct: 0,      sales_pct: 0 },
    Superior:    { sub_pct: 0.175,  sales_pct: 0.25 },
    Restoration: { sub_pct: 0.25,   sales_pct: 0.375 },
  } as Record<string, { sub_pct: number; sales_pct: number }>,
};

const FIXED_SURCHARGES = {
  color_samples: 98.95,
  cc_pct: 0.032,
  transportation: 50,
  trash: 50,
};

// ─── PAINT PRODUCTS ─────────────────────────────────────────────
const INTERIOR_PAINT = {
  walls:   { product: "Regal Select Eggshell",   coverage: 350, price_per_gallon: 63.59 },
  trim:    { product: "Regal Select Semi Gloss",  coverage: 350, price_per_gallon: 63.59 },
  primer:  { product: "Fresh Start",              coverage: 400, price_per_gallon: 44.99 },
  ceiling: { product: "Ben Moore Muresco",         coverage: 400, price_per_gallon: 40.78 },
};

// ─── BENCHMARKS ─────────────────────────────────────────────────
const INTERIOR_BENCHMARKS = {
  overall: { p25: 3546, p50: 6907, p75: 14970 },
  by_rooms: { "1-2": { p50: 5668 }, "3-4": { p50: 3813 }, "8+": { p50: 13794 } } as Record<string, { p50: number }>,
};

// ─── WALL PAINT RATE ────────────────────────────────────────────
// Cost per sqft for walls (sub cost and sales price at 1.1x default multiplier)
const WALL_RATE_SUB = 0.18;
const WALL_RATE_SALES = 0.30;
const CEILING_RATE_SUB = 0.15;
const CEILING_RATE_SALES = 0.25;

// ═══════════════════════════════════════════════════════════════
// INTERIOR PRICING ENGINE
// ═══════════════════════════════════════════════════════════════
export function calculateInteriorQuote(formData: InteriorScopeData, _catalog: CatalogConfig, multiplier: number = 1.1): QuoteResult {
  const sections: SectionResult[] = [];
  let totalSubCost = 0;
  let totalSalesPrice = 0;
  let totalAllocatedTime = 0;
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
    const wallSubCost = wallSqft * WALL_RATE_SUB;
    const wallSalesPrice = wallSqft * WALL_RATE_SALES * multiplier;
    items.push({
      label: `Walls (${wallSqft} sqft)`,
      quantity: 1,
      sub_cost: wallSubCost,
      sales_price: wallSalesPrice,
      allocated_time: wallSubCost / HOURLY_RATE / 3,
    });
    totalWallSqft += wallSqft;

    // Ceiling
    if (room.ceiling_included) {
      const ceilSubCost = ceilingSqft * CEILING_RATE_SUB;
      const ceilSalesPrice = ceilingSqft * CEILING_RATE_SALES * multiplier;
      items.push({
        label: `Ceiling (${ceilingSqft} sqft)`,
        quantity: 1,
        sub_cost: ceilSubCost,
        sales_price: ceilSalesPrice,
        allocated_time: ceilSubCost / HOURLY_RATE / 3,
      });
      totalCeilingSqft += ceilingSqft;
    }

    // Closet
    if (room.closet !== 'not_included') {
      const closetSqft = CLOSET_SQFT[room.closet] || 0;
      const closetSubCost = closetSqft * WALL_RATE_SUB;
      const closetSalesPrice = closetSqft * WALL_RATE_SALES * multiplier;
      items.push({
        label: `Closet (${room.closet})`,
        quantity: 1,
        sub_cost: closetSubCost,
        sales_price: closetSalesPrice,
        allocated_time: closetSubCost / HOURLY_RATE / 3,
      });
      totalWallSqft += closetSqft;
    }

    // Primer
    if (room.primer_required) {
      const primerSqft = wallSqft + ceilingSqft;
      totalPrimerSqft += primerSqft;
      const primerSubCost = primerSqft * 0.10;
      const primerSalesPrice = primerSqft * 0.16 * multiplier;
      items.push({
        label: `Primer (${primerSqft} sqft)`,
        quantity: 1,
        sub_cost: primerSubCost,
        sales_price: primerSalesPrice,
        allocated_time: primerSubCost / HOURLY_RATE / 3,
      });
    }

    // Line items (doors, windows, trim, repairs)
    for (const [itemName, qty] of Object.entries(room.items)) {
      if (qty <= 0) continue;
      const rate = INTERIOR_ITEM_RATES[itemName];
      if (!rate) continue;

      const lineSubCost = rate.sub_cost * qty;
      const lineSalesPrice = rate.sales_price * qty * (multiplier / 1.1); // rates already at 1.1x base
      items.push({
        label: itemName,
        quantity: qty,
        sub_cost: lineSubCost,
        sales_price: lineSalesPrice,
        allocated_time: (rate.sub_cost / HOURLY_RATE) * qty / 3,
      });

      // Track trim sqft for materials
      if (itemName.startsWith('Trim') || itemName.startsWith('Door') || itemName.startsWith('Window')) {
        totalTrimSqft += rate.sqft_per_unit * qty;
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
    totalAllocatedTime += sectionTime;
  }

  // ─── SURCHARGES ─────────────────────────────────────────────
  const surcharges: { label: string; sub_amount: number; sales_amount: number }[] = [];

  const gradeS = INTERIOR_SURCHARGES.surface_grade[formData.project.surface_grade];
  if (gradeS && (gradeS.sub_pct !== 0 || gradeS.sales_pct !== 0)) {
    surcharges.push({
      label: `Surface Grade ${formData.project.surface_grade}`,
      sub_amount: totalSubCost * gradeS.sub_pct,
      sales_amount: totalSalesPrice * gradeS.sales_pct,
    });
  }

  const prepS = INTERIOR_SURCHARGES.prep_level[formData.project.prep_level];
  if (prepS && (prepS.sub_pct !== 0 || prepS.sales_pct !== 0)) {
    surcharges.push({
      label: `Prep Level: ${formData.project.prep_level}`,
      sub_amount: totalSubCost * prepS.sub_pct,
      sales_amount: totalSalesPrice * prepS.sales_pct,
    });
  }

  if (formData.project.color_samples) {
    surcharges.push({ label: 'Color Samples', sub_amount: FIXED_SURCHARGES.color_samples, sales_amount: FIXED_SURCHARGES.color_samples });
  }
  if (formData.project.transportation) {
    surcharges.push({ label: 'Transportation', sub_amount: FIXED_SURCHARGES.transportation, sales_amount: FIXED_SURCHARGES.transportation });
  }
  surcharges.push({ label: 'Trash Removal', sub_amount: FIXED_SURCHARGES.trash, sales_amount: FIXED_SURCHARGES.trash });

  const surchargeSubTotal = surcharges.reduce((s, sc) => s + sc.sub_amount, 0);
  const surchargeSalesTotal = surcharges.reduce((s, sc) => s + sc.sales_amount, 0);

  const laborTotal = totalSalesPrice + surchargeSalesTotal;

  // CC fee on grand total (we'll calc after materials)
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
  const paintingHours = totalAllocatedTime;
  const crewSize = paintingHours > 48 ? 3 : 2;
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
  let benchmarks: { percentile: string; message: string } | undefined;
  const roomCount = formData.rooms.length;
  const benchmarkKey = roomCount <= 2 ? '1-2' : roomCount <= 4 ? '3-4' : '8+';
  const p50 = INTERIOR_BENCHMARKS.by_rooms[benchmarkKey]?.p50;
  if (p50) {
    const pct = grandTotal < INTERIOR_BENCHMARKS.overall.p25 ? 'below 25th' :
      grandTotal < INTERIOR_BENCHMARKS.overall.p50 ? '25th-50th' :
      grandTotal < INTERIOR_BENCHMARKS.overall.p75 ? '50th-75th' : 'above 75th';
    benchmarks = { percentile: pct, message: `Your estimate of $${Math.round(grandTotal).toLocaleString()} is at the ${pct} percentile for interior ${roomCount}-room jobs` };
  }

  // ─── COMPLETENESS WARNINGS ──────────────────────────────────
  const completenessWarnings: string[] = [];
  const totalItems = formData.rooms.reduce((s, r) => s + Object.values(r.items).reduce((a, b) => a + b, 0), 0);
  const hasTrim = formData.rooms.some(r => Object.entries(r.items).some(([k, v]) => k.startsWith('Trim') && v > 0));
  const hasDoors = formData.rooms.some(r => Object.entries(r.items).some(([k, v]) => k.startsWith('Door') && v > 0));

  if (roomCount >= 3 && !hasTrim) {
    completenessWarnings.push('Most 3+ room jobs include baseboard trim. Did you check for trim work?');
  }
  if (roomCount >= 2 && !hasDoors) {
    completenessWarnings.push('Did you check for door painting?');
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
// EXTERIOR PRICING ENGINE
// ═══════════════════════════════════════════════════════════════

// Sub cost = 50% of sales price for all exterior items
const EXTERIOR_ITEM_RATES: Record<string, Record<string, { sales_price: number; sqft_per_unit: number; material_price?: number }>> = {
  siding: {
    "Cedar Shingles": { sales_price: 660, sqft_per_unit: 200 },
    "Clapboard":      { sales_price: 550, sqft_per_unit: 200 },
    "HardieBoard":    { sales_price: 440, sqft_per_unit: 200 },
    "PVC Siding":     { sales_price: 385, sqft_per_unit: 200 },
    "Decking":        { sales_price: 550, sqft_per_unit: 200 },
  },
  doors: {
    "Standard Frame": { sales_price: 82.50,  sqft_per_unit: 21 },
    "Double Frame":   { sales_price: 123.75, sqft_per_unit: 42 },
    "w/Glass":        { sales_price: 110.00, sqft_per_unit: 21 },
    "w/Panels":       { sales_price: 99.00,  sqft_per_unit: 21 },
    "Metal":          { sales_price: 71.50,  sqft_per_unit: 21 },
    "High Gloss":     { sales_price: 137.50, sqft_per_unit: 21 },
    "Bulkhead":       { sales_price: 165.00, sqft_per_unit: 30 },
    "Garage":         { sales_price: 220.00, sqft_per_unit: 160 },
  },
  windows: {
    "Standard":     { sales_price: 82.50,  sqft_per_unit: 15 },
    "Non-Standard": { sales_price: 110.00, sqft_per_unit: 20 },
    "Dormer":       { sales_price: 137.50, sqft_per_unit: 25 },
    "Bay":          { sales_price: 165.00, sqft_per_unit: 30 },
    "Shutters":     { sales_price: 55.00,  sqft_per_unit: 12 },
    "Basement":     { sales_price: 44.00,  sqft_per_unit: 8 },
  },
  trim: {
    "Fascia (10ft)":    { sales_price: 82.50,  sqft_per_unit: 20 },
    "Dentil Molding":   { sales_price: 110.00, sqft_per_unit: 10 },
    "Downspout":        { sales_price: 44.00,  sqft_per_unit: 8 },
    "Column":           { sales_price: 165.00, sqft_per_unit: 30 },
    "Soffit (10ft)":    { sales_price: 110.00, sqft_per_unit: 30 },
    "Spindles (10ft)":  { sales_price: 315.00, sqft_per_unit: 430 },
    "Staircase":        { sales_price: 275.00, sqft_per_unit: 60 },
    "Handrail":         { sales_price: 82.50,  sqft_per_unit: 10 },
    "Fencing (10ft)":   { sales_price: 137.50, sqft_per_unit: 40 },
    "Dormer Fascia":    { sales_price: 110.00, sqft_per_unit: 20 },
    "Porch Ceiling":    { sales_price: 220.00, sqft_per_unit: 80 },
    "Ornate":           { sales_price: 330.00, sqft_per_unit: 40 },
  },
  carpentry_repairs: {
    "Cedar Shingle (1/2 Sq)": { sales_price: 275.00, sqft_per_unit: 100, material_price: 150 },
    "Cedar Shingle (1 Sq)":   { sales_price: 495.00, sqft_per_unit: 200, material_price: 275 },
    "Clapboard":              { sales_price: 165.00, sqft_per_unit: 32,  material_price: 45 },
    "Fascia Board (8ft)":     { sales_price: 110.00, sqft_per_unit: 8,   material_price: 30 },
    "Molding (8ft)":          { sales_price: 88.00,  sqft_per_unit: 8,   material_price: 25 },
    "Window Sill":            { sales_price: 110.00, sqft_per_unit: 4,   material_price: 35 },
    "Window Frame":           { sales_price: 165.00, sqft_per_unit: 12,  material_price: 55 },
    "Window Flashing":        { sales_price: 88.00,  sqft_per_unit: 6,   material_price: 20 },
    "Spindle":                { sales_price: 55.00,  sqft_per_unit: 2,   material_price: 18 },
    "Newel Post":             { sales_price: 220.00, sqft_per_unit: 8,   material_price: 85 },
    "Handrail Assy":          { sales_price: 330.00, sqft_per_unit: 20,  material_price: 120 },
    "Deck Board (12ft)":      { sales_price: 88.00,  sqft_per_unit: 12,  material_price: 30 },
    "Deck Board Premium":     { sales_price: 132.00, sqft_per_unit: 12,  material_price: 55 },
  },
};

const EXTERIOR_SURCHARGES = {
  surface_grade: {
    A: { sub_pct: 0,    sales_pct: 0 },
    B: { sub_pct: 0,    sales_pct: 0 },
    C: { sub_pct: 0.05, sales_pct: 0.10 },
    D: { sub_pct: 0.10, sales_pct: 0.15 },
  } as Record<string, { sub_pct: number; sales_pct: number }>,
  color_scheme: {
    "1-2 Colors": { sub_pct: 0,    sales_pct: 0 },
    "3 Colors":   { sub_pct: 0.03, sales_pct: 0.06 },
    "4 Colors":   { sub_pct: 0.05, sales_pct: 0.10 },
  } as Record<string, { sub_pct: number; sales_pct: number }>,
  staging: {
    No:  { sub_pct: 0,    sales_pct: 0 },
    Yes: { sub_pct: 0.10, sales_pct: 0.15 },
  } as Record<string, { sub_pct: number; sales_pct: number }>,
  prep_level: {
    Basic:       { sub_pct: -0.075, sales_pct: -0.075 },
    Standard:    { sub_pct: 0,      sales_pct: 0 },
    Superior:    { sub_pct: 0.125,  sales_pct: 0.25 },
    Restoration: { sub_pct: 0.25,   sales_pct: 0.375 },
  } as Record<string, { sub_pct: number; sales_pct: number }>,
};

const EXTERIOR_PAINT = {
  trim:   { product: "Moorgard Soft Gloss", coverage: 300, price_per_gallon: 69.59 },
  siding: { product: "Moorgard Low Lustre", coverage: 300, price_per_gallon: 69.59 },
};

const EXTERIOR_BENCHMARKS = {
  overall: { p25: 3994, p50: 11797, p75: 24447 },
  by_surfaces: { "1-2": { p50: 3030 }, "3-4": { p50: 17964 }, "5+": { p50: 24447 } } as Record<string, { p50: number }>,
};

export function calculateExteriorQuote(formData: ExteriorScopeData, _catalog: CatalogConfig, multiplier: number = 1.1): QuoteResult {
  const sections: SectionResult[] = [];
  let totalSubCost = 0;
  let totalSalesPrice = 0;
  let totalAllocatedTime = 0;
  let totalSidingSqft = 0;
  let totalTrimSqft = 0;
  let totalCarpentryMaterials = 0;

  for (const surface of formData.surfaces) {
    const items: LineItem[] = [];

    for (const [category, categoryRates] of Object.entries(EXTERIOR_ITEM_RATES)) {
      const surfaceItems = (surface as any)[category] as Record<string, number> | undefined;
      if (!surfaceItems) continue;

      for (const [itemName, qty] of Object.entries(surfaceItems)) {
        if (qty <= 0) continue;
        const rate = categoryRates[itemName];
        if (!rate) continue;

        const salesPrice = rate.sales_price * qty * (multiplier / 1.1);
        const subCost = salesPrice * 0.50;

        items.push({
          label: `${itemName}`,
          quantity: qty,
          sub_cost: subCost,
          sales_price: salesPrice,
          allocated_time: subCost / HOURLY_RATE / 3,
        });

        if (category === 'siding') totalSidingSqft += rate.sqft_per_unit * qty;
        if (category === 'trim' || category === 'doors' || category === 'windows') totalTrimSqft += rate.sqft_per_unit * qty;
        if (category === 'carpentry_repairs' && rate.material_price) {
          totalCarpentryMaterials += rate.material_price * qty * 0.75;
        }
      }
    }

    const sectionSubCost = items.reduce((s, i) => s + i.sub_cost, 0);
    const sectionSalesPrice = items.reduce((s, i) => s + i.sales_price, 0);

    sections.push({ label: surface.name, items, sub_cost: sectionSubCost, sales_price: sectionSalesPrice });
    totalSubCost += sectionSubCost;
    totalSalesPrice += sectionSalesPrice;
    totalAllocatedTime += items.reduce((s, i) => s + i.allocated_time, 0);
  }

  // Surcharges
  const surcharges: { label: string; sub_amount: number; sales_amount: number }[] = [];

  const gradeS = EXTERIOR_SURCHARGES.surface_grade[formData.project.surface_grade];
  if (gradeS && (gradeS.sub_pct !== 0 || gradeS.sales_pct !== 0)) {
    surcharges.push({ label: `Surface Grade ${formData.project.surface_grade}`, sub_amount: totalSubCost * gradeS.sub_pct, sales_amount: totalSalesPrice * gradeS.sales_pct });
  }
  const colorS = EXTERIOR_SURCHARGES.color_scheme[formData.project.color_scheme];
  if (colorS && (colorS.sub_pct !== 0 || colorS.sales_pct !== 0)) {
    surcharges.push({ label: `Color Scheme: ${formData.project.color_scheme}`, sub_amount: totalSubCost * colorS.sub_pct, sales_amount: totalSalesPrice * colorS.sales_pct });
  }
  const stagingS = EXTERIOR_SURCHARGES.staging[formData.project.staging ? 'Yes' : 'No'];
  if (stagingS && (stagingS.sub_pct !== 0 || stagingS.sales_pct !== 0)) {
    surcharges.push({ label: 'Staging', sub_amount: totalSubCost * stagingS.sub_pct, sales_amount: totalSalesPrice * stagingS.sales_pct });
  }
  const prepS = EXTERIOR_SURCHARGES.prep_level[formData.project.prep_level];
  if (prepS && (prepS.sub_pct !== 0 || prepS.sales_pct !== 0)) {
    surcharges.push({ label: `Prep: ${formData.project.prep_level}`, sub_amount: totalSubCost * prepS.sub_pct, sales_amount: totalSalesPrice * prepS.sales_pct });
  }

  if (formData.project.color_samples) surcharges.push({ label: 'Color Samples', sub_amount: 98.95, sales_amount: 98.95 });
  surcharges.push({ label: 'Trash Removal', sub_amount: 225, sales_amount: 225 });
  surcharges.push({ label: 'Transportation', sub_amount: 50, sales_amount: 50 });

  const surchargeSalesTotal = surcharges.reduce((s, sc) => s + sc.sales_amount, 0);
  const surchargeSubTotal = surcharges.reduce((s, sc) => s + sc.sub_amount, 0);
  const laborTotal = totalSalesPrice + surchargeSalesTotal;

  // Materials
  const materials: { label: string; gallons: number; cost: number }[] = [];
  if (totalSidingSqft > 0) {
    const g = Math.ceil(totalSidingSqft / EXTERIOR_PAINT.siding.coverage);
    materials.push({ label: EXTERIOR_PAINT.siding.product, gallons: g, cost: g * EXTERIOR_PAINT.siding.price_per_gallon });
  }
  if (totalTrimSqft > 0) {
    const g = Math.ceil(totalTrimSqft / EXTERIOR_PAINT.trim.coverage);
    materials.push({ label: EXTERIOR_PAINT.trim.product, gallons: g, cost: g * EXTERIOR_PAINT.trim.price_per_gallon });
  }
  if (totalCarpentryMaterials > 0) {
    materials.push({ label: 'Carpentry Materials', gallons: 0, cost: totalCarpentryMaterials });
  }

  const materialSubtotal = materials.reduce((s, m) => s + m.cost, 0);
  const materialsTotal = materialSubtotal + materialSubtotal * 0.10;

  const grandBeforeCC = laborTotal + materialsTotal;
  const ccFee = grandBeforeCC * 0.032;
  surcharges.push({ label: 'CC Fee (3.2%)', sub_amount: ccFee, sales_amount: ccFee });
  const grandTotal = grandBeforeCC + ccFee;

  const paintingHours = totalAllocatedTime;
  const crewSize = paintingHours > 24 ? 3 : 2;
  const durationDays = Math.max(paintingHours / crewSize / 8, 0.5);

  const laborIncome = laborTotal;
  const materialIncome = materialsTotal;
  const totalPrice = laborIncome + materialIncome;
  const laborExpense = totalSubCost + surchargeSubTotal;
  const materialExpense = materialsTotal * 0.80;
  const grossProfit = totalPrice - laborExpense - materialExpense;
  const tax = grossProfit * 0.25;
  const overheads = grossProfit * 0.12;
  const netProfit = grossProfit - tax - overheads;

  // Benchmarks
  const surfCount = formData.surfaces.length;
  const bKey = surfCount <= 2 ? '1-2' : surfCount <= 4 ? '3-4' : '5+';
  const bOverall = EXTERIOR_BENCHMARKS.overall;
  const pct = grandTotal < bOverall.p25 ? 'below 25th' : grandTotal < bOverall.p50 ? '25th-50th' : grandTotal < bOverall.p75 ? '50th-75th' : 'above 75th';
  const benchmarks = { percentile: pct, message: `Your estimate of $${Math.round(grandTotal).toLocaleString()} is at the ${pct} percentile for exterior ${surfCount}-surface jobs` };

  // Completeness
  const completenessWarnings: string[] = [];
  const hasSiding = formData.surfaces.some(s => Object.values(s.siding).some(v => v > 0));
  const hasTrim = formData.surfaces.some(s => Object.values(s.trim).some(v => v > 0));
  const hasRepairs = formData.surfaces.some(s => Object.values(s.carpentry_repairs).some(v => v > 0));
  if (hasSiding && !hasTrim) completenessWarnings.push('52% of exterior jobs include trim work. Did you check for trim?');
  if (surfCount >= 3 && !hasRepairs) completenessWarnings.push('27% of multi-surface jobs need repairs. Did you check for carpentry?');

  return {
    trade_type: 'exterior', sections, labor_subtotal: totalSalesPrice, surcharges,
    labor_total: laborTotal + ccFee, materials, materials_total: materialsTotal,
    grand_total: grandTotal,
    production: { painting_hours: paintingHours, crew_size: crewSize, duration_days: durationDays },
    profitability: { labor_income: laborIncome, material_income: materialIncome, total_price: totalPrice, labor_expense: laborExpense, material_expense: materialExpense, gross_profit: grossProfit, tax, overheads, net_profit: netProfit },
    benchmarks, completeness_warnings: completenessWarnings,
  };
}

// ═══════════════════════════════════════════════════════════════
// EPOXY PRICING ENGINE
// ═══════════════════════════════════════════════════════════════

const EPOXY_COATING_RATES: Record<string, number> = {
  "Standard Epoxy": 5.00,
  "Premium Epoxy": 8.50,
  "Polyurea": 7.50,
  "Polyaspartic": 8.50,
};

const EPOXY_CONDITION_MOD: Record<string, number> = { Good: 1.0, Fair: 1.15, Poor: 1.35 };

const EPOXY_OPTIONS = {
  concrete_grinding_light: 1.50,
  concrete_grinding_heavy: 3.50,
  crack_repair_minor: 2.00,
  crack_repair_major: 4.00,
  moisture_mitigation: 2.25,
  existing_coating_removal: 3.00,
  cove_base: 12.00,
  flake_standard: 1.00,
  flake_full: 2.00,
  flake_metallic: 3.00,
};

export function calculateEpoxyQuote(formData: EpoxyScopeData, _catalog: CatalogConfig, multiplier: number = 1.1): QuoteResult {
  const sections: SectionResult[] = [];
  let totalSalesPrice = 0;

  for (const floor of formData.floors) {
    const items: LineItem[] = [];
    const coatingRate = EPOXY_COATING_RATES[floor.coating_type] || 5.00;
    const condMod = EPOXY_CONDITION_MOD[floor.floor_condition] || 1.0;

    // Base coating
    const baseCost = floor.sqft * coatingRate * condMod * (multiplier / 1.1);
    items.push({ label: `${floor.coating_type} (${floor.sqft} sqft, ${floor.floor_condition})`, quantity: floor.sqft, sub_cost: baseCost * 0.5, sales_price: baseCost, allocated_time: floor.sqft / 200 });

    // Options
    if (floor.existing_coating_removal) {
      const cost = floor.sqft * EPOXY_OPTIONS.existing_coating_removal;
      items.push({ label: 'Existing Coating Removal', quantity: floor.sqft, sub_cost: cost * 0.5, sales_price: cost, allocated_time: floor.sqft / 150 });
    }
    if (floor.moisture_issues) {
      const cost = floor.sqft * EPOXY_OPTIONS.moisture_mitigation;
      items.push({ label: 'Moisture Mitigation', quantity: floor.sqft, sub_cost: cost * 0.5, sales_price: cost, allocated_time: floor.sqft / 200 });
    }
    if (floor.color_flake !== 'none') {
      const flakeRate = floor.color_flake === 'standard' ? EPOXY_OPTIONS.flake_standard :
        floor.color_flake === 'full' ? EPOXY_OPTIONS.flake_full : EPOXY_OPTIONS.flake_metallic;
      const cost = floor.sqft * flakeRate;
      items.push({ label: `${floor.color_flake} Flake`, quantity: floor.sqft, sub_cost: cost * 0.5, sales_price: cost, allocated_time: floor.sqft / 300 });
    }
    if (floor.cove_base && floor.cove_base_linear_feet > 0) {
      const cost = floor.cove_base_linear_feet * EPOXY_OPTIONS.cove_base;
      items.push({ label: `Cove Base (${floor.cove_base_linear_feet} lf)`, quantity: floor.cove_base_linear_feet, sub_cost: cost * 0.5, sales_price: cost, allocated_time: floor.cove_base_linear_feet / 20 });
    }

    const sectionSales = items.reduce((s, i) => s + i.sales_price, 0);
    const sectionSub = items.reduce((s, i) => s + i.sub_cost, 0);
    sections.push({ label: `${floor.area_type} (${floor.sqft} sqft)`, items, sub_cost: sectionSub, sales_price: sectionSales });
    totalSalesPrice += sectionSales;
  }

  const totalSubCost = sections.reduce((s, sec) => s + sec.sub_cost, 0);
  const totalTime = sections.reduce((s, sec) => s + sec.items.reduce((a, i) => a + i.allocated_time, 0), 0);

  // Project-level options
  const surcharges: { label: string; sub_amount: number; sales_amount: number }[] = [];
  const totalSqft = formData.floors.reduce((s, f) => s + f.sqft, 0);

  if (formData.project.concrete_grinding) {
    const grindingRate = formData.floors.some(f => f.floor_condition === 'Poor') ? EPOXY_OPTIONS.concrete_grinding_heavy : EPOXY_OPTIONS.concrete_grinding_light;
    const cost = totalSqft * grindingRate;
    surcharges.push({ label: 'Concrete Grinding', sub_amount: cost * 0.5, sales_amount: cost });
  }
  if (formData.project.crack_repair !== 'none') {
    const rate = formData.project.crack_repair === 'minor' ? EPOXY_OPTIONS.crack_repair_minor : EPOXY_OPTIONS.crack_repair_major;
    const affectedSqft = totalSqft * (formData.project.crack_repair === 'minor' ? 0.10 : 0.25);
    const cost = affectedSqft * rate;
    surcharges.push({ label: `Crack Repair (${formData.project.crack_repair})`, sub_amount: cost * 0.5, sales_amount: cost });
  }

  surcharges.push({ label: 'Transportation', sub_amount: 50, sales_amount: 50 });

  const surchargeSales = surcharges.reduce((s, sc) => s + sc.sales_amount, 0);
  const surchargeSub = surcharges.reduce((s, sc) => s + sc.sub_amount, 0);

  // Materials (epoxy, primer, topcoat)
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

  const crewSize = 2;
  const durationDays = Math.max(totalTime / crewSize / 8, 1);

  const laborIncome = laborTotal;
  const materialIncome = materialsTotal;
  const totalPrice = laborIncome + materialIncome;
  const laborExpense = totalSubCost + surchargeSub;
  const materialExpense = materialsTotal * 0.80;
  const grossProfit = totalPrice - laborExpense - materialExpense;

  return {
    trade_type: 'epoxy', sections, labor_subtotal: totalSalesPrice, surcharges,
    labor_total: laborTotal, materials, materials_total: materialsTotal, grand_total: grandTotal,
    production: { painting_hours: totalTime, crew_size: crewSize, duration_days: durationDays },
    profitability: { labor_income: laborIncome, material_income: materialIncome, total_price: totalPrice, labor_expense: laborExpense, material_expense: materialExpense, gross_profit: grossProfit, tax: grossProfit * 0.25, overheads: grossProfit * 0.12, net_profit: grossProfit * 0.63 },
    completeness_warnings: [],
  };
}

function emptyQuote(trade_type: 'interior' | 'exterior' | 'epoxy'): QuoteResult {
  return {
    trade_type,
    sections: [],
    labor_subtotal: 0,
    surcharges: [],
    labor_total: 0,
    materials: [],
    materials_total: 0,
    grand_total: 0,
    production: { painting_hours: 0, crew_size: 2, duration_days: 0 },
    profitability: { labor_income: 0, material_income: 0, total_price: 0, labor_expense: 0, material_expense: 0, gross_profit: 0, tax: 0, overheads: 0, net_profit: 0 },
    completeness_warnings: [],
  };
}
