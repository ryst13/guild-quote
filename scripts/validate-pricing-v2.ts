/**
 * GAN Framework Validation Script
 *
 * Runs both pricing engines on identical scopes and compares outputs.
 * Tests the bottom-up engine against expected GAN ratios.
 */

// Import from built output since we can't use SvelteKit aliases in a standalone script
import { calculateInteriorQuote, calculateExteriorQuote, calculateEpoxyQuote } from '../src/lib/server/pricing.js';
import { calculateInteriorBottomUp, calculateExteriorBottomUp, calculateEpoxyBottomUp, resolveSettings, METRO_WAGES } from '../src/lib/server/pricing-v2.js';
import type { InteriorScopeData, ExteriorScopeData, EpoxyScopeData, TenantConfig, CatalogConfig } from '../src/lib/types/index.js';

// ─── TEST SCOPE: 3-Bedroom Interior ─────────────────────────────
const testScope: InteriorScopeData = {
  client: { name: 'Test Client', email: 'test@test.com', phone: '555-0000', address: '123 Test St', notes: '' },
  rooms: [
    {
      id: '1', room_type: 'Bedroom', room_size: 'Medium', ceiling_included: true,
      closet: 'medium', primer_required: false,
      items: { 'Door - Frame Standard': 2, 'Window - Standard Frame': 1, 'Trim - Baseboard/Crown': 1 },
      notes: '',
    },
    {
      id: '2', room_type: 'Bedroom', room_size: 'Medium', ceiling_included: true,
      closet: 'medium', primer_required: false,
      items: { 'Door - Frame Standard': 2, 'Window - Standard Frame': 1, 'Trim - Baseboard/Crown': 1 },
      notes: '',
    },
    {
      id: '3', room_type: 'Living Room', room_size: 'Medium', ceiling_included: true,
      closet: 'not_included', primer_required: false,
      items: { 'Door - Frame Standard': 2, 'Window - Standard Frame': 2, 'Trim - Baseboard/Crown': 1 },
      notes: '',
    },
  ],
  project: {
    surface_grade: 'B',
    prep_level: 'Standard',
    color_samples: false,
    transportation: false,
    notes: '',
  },
};

const emptyCatalog: CatalogConfig = {
  room_types: [], room_sizes: [], size_descriptions: {},
  ceiling_heights: [], condition_levels: [], special_conditions: {},
  furniture_handling: {}, pricing: {},
};

// Mock tenant for bottom-up engine
const mockTenant: TenantConfig = {
  id: 'test', slug: 'test', company_name: 'Test Co',
  logo_url: null, primary_color: '#2563eb', accent_color: '#1e40af',
  contact_email: 'test@test.com', contact_phone: '555-0000',
  website_url: '', service_areas: '',
  enabled_trades: ['interior', 'exterior'],
  labor_price_multiplier: 1.1,
  output_format: 'pdf',
  google_refresh_token: null,
  google_drive_folder_id: null,
  google_drive_root_folder_id: null,
  google_drive_active_folder_id: null,
  google_drive_inactive_folder_id: null,
  catalog: emptyCatalog,
  show_losp: true,
  crew_hourly_wage: 27.00,       // Boston wage
  default_crew_size: 2,
  target_gross_margin: 0.455,     // 45.5% = matches 1.1x multiplier effect
  pricing_mode: 'bottom_up',
  metro_area: 'boston',
  stripe_customer_id: null,
  payment_status: 'none',
  plan: 'trial',
  lifetime_access: false,
  trial_ends_at: null,
  referral_code: null,
  referral_credits: 0,
};

// ─── RUN BOTH ENGINES ────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════');
console.log('GAN FRAMEWORK VALIDATION — Interior 3-Room Test');
console.log('═══════════════════════════════════════════════════\n');

const v1 = calculateInteriorQuote(testScope, emptyCatalog, 1.1);
const v2 = calculateInteriorBottomUp(testScope, emptyCatalog, mockTenant);

console.log('Settings:');
const settings = resolveSettings(mockTenant);
console.log(`  Crew wage: $${settings.crew_wage}/hr`);
console.log(`  Gross margin: ${(settings.gross_margin * 100).toFixed(1)}%`);
console.log(`  Crew size: ${settings.crew_size}`);
console.log();

console.log('┌──────────────────────┬────────────┬────────────┬──────────┐');
console.log('│ Metric               │ Top-Down   │ Bottom-Up  │ Delta    │');
console.log('├──────────────────────┼────────────┼────────────┼──────────┤');

const fmt = (n: number) => `$${Math.round(n).toLocaleString().padStart(7)}`;
const pct = (a: number, b: number) => `${((a - b) / b * 100).toFixed(1)}%`.padStart(7);

console.log(`│ Grand Total          │ ${fmt(v1.grand_total)} │ ${fmt(v2.grand_total)} │ ${pct(v2.grand_total, v1.grand_total)} │`);
console.log(`│ Labor Subtotal       │ ${fmt(v1.labor_subtotal)} │ ${fmt(v2.labor_subtotal)} │ ${pct(v2.labor_subtotal, v1.labor_subtotal)} │`);
console.log(`│ Materials Total      │ ${fmt(v1.materials_total)} │ ${fmt(v2.materials_total)} │ ${pct(v2.materials_total, v1.materials_total)} │`);
console.log(`│ Painting Hours       │ ${v1.production.painting_hours.toFixed(1).padStart(8)} │ ${v2.production.painting_hours.toFixed(1).padStart(8)} │ ${pct(v2.production.painting_hours, v1.production.painting_hours)} │`);
console.log(`│ Duration (days)      │ ${v1.production.duration_days.toFixed(1).padStart(8)} │ ${v2.production.duration_days.toFixed(1).padStart(8)} │         │`);
console.log('├──────────────────────┼────────────┼────────────┼──────────┤');

// GAN ratios
const v1SubTotal = v1.sections.reduce((s, sec) => s + sec.sub_cost, 0);
const v2SubTotal = v2.sections.reduce((s, sec) => s + sec.sub_cost, 0);
const v1Ratio = v1SubTotal / v1.labor_subtotal;
const v2Ratio = v2SubTotal / v2.labor_subtotal;

console.log(`│ Sub Cost (labor)     │ ${fmt(v1SubTotal)} │ ${fmt(v2SubTotal)} │         │`);
console.log(`│ Sub:Sales Ratio      │ ${v1Ratio.toFixed(3).padStart(8)} │ ${v2Ratio.toFixed(3).padStart(8)} │ GAN=0.60│`);
console.log(`│ Gross Margin %       │ ${((1 - v1Ratio) * 100).toFixed(1).padStart(7)}% │ ${((1 - v2Ratio) * 100).toFixed(1).padStart(7)}% │ GAN=40% │`);
console.log('├──────────────────────┼────────────┼────────────┼──────────┤');
console.log(`│ Gross Profit         │ ${fmt(v1.profitability.gross_profit)} │ ${fmt(v2.profitability.gross_profit)} │         │`);
console.log(`│ Net Profit           │ ${fmt(v1.profitability.net_profit)} │ ${fmt(v2.profitability.net_profit)} │         │`);
console.log('└──────────────────────┴────────────┴────────────┴──────────┘');

console.log('\n─── PER-SECTION COMPARISON ─────────────────────────');
for (let i = 0; i < v1.sections.length; i++) {
  const s1 = v1.sections[i];
  const s2 = v2.sections[i];
  console.log(`${s1.label}: v1=${fmt(s1.sales_price)} v2=${fmt(s2.sales_price)} (${pct(s2.sales_price, s1.sales_price)})`);

  for (let j = 0; j < Math.max(s1.items.length, s2.items.length); j++) {
    const i1 = s1.items[j];
    const i2 = s2.items[j];
    if (i1 && i2) {
      const delta = ((i2.sales_price - i1.sales_price) / i1.sales_price * 100).toFixed(0);
      console.log(`  ${i1.label.padEnd(30)} v1=${fmt(i1.sales_price)} v2=${fmt(i2.sales_price)} (${delta}%)`);
    }
  }
}

console.log('\n─── GAN FRAMEWORK CHECK ────────────────────────────');
const ganTarget = 0.60; // sub should be ~60% of sales for interior at 1.0x
const tolerance = 0.10; // ±10 percentage points acceptable

if (Math.abs(v2Ratio - (1 - settings.gross_margin)) < 0.02) {
  console.log(`✓ Sub:Sales ratio (${v2Ratio.toFixed(3)}) matches target margin (${(1 - settings.gross_margin).toFixed(3)})`);
} else {
  console.log(`✗ Sub:Sales ratio (${v2Ratio.toFixed(3)}) doesn't match target margin (${(1 - settings.gross_margin).toFixed(3)})`);
}

if (Math.abs(v1.grand_total - v2.grand_total) / v1.grand_total < 0.15) {
  console.log(`✓ Engines within 15% of each other (delta: ${pct(v2.grand_total, v1.grand_total).trim()})`);
} else {
  console.log(`✗ Engines diverge by more than 15% — complexity factors need tuning`);
}

// Test with different metros
console.log('\n─── METRO WAGE SENSITIVITY ─────────────────────────');
for (const [metro, wage] of Object.entries(METRO_WAGES)) {
  if (metro === 'national') continue;
  const metroTenant = { ...mockTenant, crew_hourly_wage: wage, metro_area: metro };
  const metroQuote = calculateInteriorBottomUp(testScope, emptyCatalog, metroTenant);
  console.log(`  ${metro.padEnd(18)} wage=$${wage.toFixed(2).padEnd(6)} → grand_total=${fmt(metroQuote.grand_total)}`);
}

// ═══════════════════════════════════════════════════════════════
// EXTERIOR VALIDATION
// ═══════════════════════════════════════════════════════════════

const extScope: ExteriorScopeData = {
  client: { name: 'Test Client', email: 'test@test.com', phone: '555-0000', address: '123 Test St', notes: '' },
  surfaces: [
    {
      id: '1', name: 'Front',
      siding: { 'Clapboard': 2 },
      doors: { 'Standard Frame': 1 },
      windows: { 'Standard': 3 },
      trim: { 'Fascia (10ft)': 2, 'Soffit (10ft)': 1 },
      carpentry_repairs: {},
      notes: '',
    },
    {
      id: '2', name: 'Left Side',
      siding: { 'Clapboard': 1 },
      doors: {},
      windows: { 'Standard': 2 },
      trim: { 'Fascia (10ft)': 1 },
      carpentry_repairs: { 'Clapboard': 2 },
      notes: '',
    },
  ],
  project: {
    surface_grade: 'B',
    prep_level: 'Standard',
    color_scheme: '1-2 Colors',
    staging: false,
    color_samples: false,
    notes: '',
  },
};

console.log('\n\n═══════════════════════════════════════════════════');
console.log('GAN FRAMEWORK VALIDATION — Exterior 2-Surface Test');
console.log('═══════════════════════════════════════════════════\n');

const ev1 = calculateExteriorQuote(extScope, emptyCatalog, 1.1);
const ev2 = calculateExteriorBottomUp(extScope, emptyCatalog, mockTenant);

console.log('┌──────────────────────┬────────────┬────────────┬──────────┐');
console.log('│ Metric               │ Top-Down   │ Bottom-Up  │ Delta    │');
console.log('├──────────────────────┼────────────┼────────────┼──────────┤');
console.log(`│ Grand Total          │ ${fmt(ev1.grand_total)} │ ${fmt(ev2.grand_total)} │ ${pct(ev2.grand_total, ev1.grand_total)} │`);
console.log(`│ Labor Subtotal       │ ${fmt(ev1.labor_subtotal)} │ ${fmt(ev2.labor_subtotal)} │ ${pct(ev2.labor_subtotal, ev1.labor_subtotal)} │`);
console.log(`│ Materials Total      │ ${fmt(ev1.materials_total)} │ ${fmt(ev2.materials_total)} │ ${pct(ev2.materials_total, ev1.materials_total)} │`);
console.log(`│ Painting Hours       │ ${ev1.production.painting_hours.toFixed(1).padStart(8)} │ ${ev2.production.painting_hours.toFixed(1).padStart(8)} │         │`);
console.log('├──────────────────────┼────────────┼────────────┼──────────┤');

const ev1SubTotal = ev1.sections.reduce((s, sec) => s + sec.sub_cost, 0);
const ev2SubTotal = ev2.sections.reduce((s, sec) => s + sec.sub_cost, 0);
console.log(`│ Sub:Sales Ratio      │ ${(ev1SubTotal / ev1.labor_subtotal).toFixed(3).padStart(8)} │ ${(ev2SubTotal / ev2.labor_subtotal).toFixed(3).padStart(8)} │ GAN=0.50│`);
console.log('└──────────────────────┴────────────┴────────────┴──────────┘');

console.log('\n─── PER-SECTION COMPARISON ─────────────────────────');
for (let i = 0; i < ev1.sections.length; i++) {
  const s1 = ev1.sections[i];
  const s2 = ev2.sections[i];
  if (!s2) { console.log(`${s1.label}: v1=${fmt(s1.sales_price)} (no v2 match)`); continue; }
  console.log(`${s1.label}: v1=${fmt(s1.sales_price)} v2=${fmt(s2.sales_price)} (${pct(s2.sales_price, s1.sales_price)})`);

  for (let j = 0; j < Math.max(s1.items.length, s2.items.length); j++) {
    const i1 = s1.items[j];
    const i2 = s2.items[j];
    if (i1 && i2 && i1.label === i2.label) {
      const delta = i1.sales_price > 0 ? ((i2.sales_price - i1.sales_price) / i1.sales_price * 100).toFixed(0) : 'n/a';
      console.log(`  ${i1.label.padEnd(30)} v1=${fmt(i1.sales_price)} v2=${fmt(i2.sales_price)} (${delta}%)`);
    } else {
      if (i1) console.log(`  ${i1.label.padEnd(30)} v1=${fmt(i1.sales_price)}`);
      if (i2) console.log(`  ${i2.label.padEnd(30)}              v2=${fmt(i2.sales_price)}`);
    }
  }
}

if (Math.abs(ev1.grand_total - ev2.grand_total) / ev1.grand_total < 0.15) {
  console.log(`\n✓ Exterior engines within 15% (delta: ${pct(ev2.grand_total, ev1.grand_total).trim()})`);
} else {
  console.log(`\n✗ Exterior engines diverge by ${pct(ev2.grand_total, ev1.grand_total).trim()} — needs tuning`);
}

// ═══════════════════════════════════════════════════════════════
// EPOXY VALIDATION
// ═══════════════════════════════════════════════════════════════

const epoxyScope: EpoxyScopeData = {
  client: { name: 'Test', email: 'test@test.com', phone: '', address: '123 Test', notes: '' },
  floors: [
    {
      id: '1', area_type: '2-Car Garage', sqft: 500,
      coating_type: 'Standard Epoxy', floor_condition: 'Good',
      existing_coating_removal: false, moisture_issues: false,
      color_flake: 'standard', cove_base: false, cove_base_linear_feet: 0,
    },
  ],
  project: {
    concrete_grinding: true,
    crack_repair: 'minor',
    timeline: '1-2 weeks',
    notes: '',
  },
};

console.log('\n\n═══════════════════════════════════════════════════');
console.log('GAN FRAMEWORK VALIDATION — Epoxy 500sqft Garage');
console.log('═══════════════════════════════════════════════════\n');

const ep1 = calculateEpoxyQuote(epoxyScope, emptyCatalog, 1.1);
const ep2 = calculateEpoxyBottomUp(epoxyScope, emptyCatalog, mockTenant);

console.log('┌──────────────────────┬────────────┬────────────┬──────────┐');
console.log('│ Metric               │ Top-Down   │ Bottom-Up  │ Delta    │');
console.log('├──────────────────────┼────────────┼────────────┼──────────┤');
console.log(`│ Grand Total          │ ${fmt(ep1.grand_total)} │ ${fmt(ep2.grand_total)} │ ${pct(ep2.grand_total, ep1.grand_total)} │`);
console.log(`│ Labor Subtotal       │ ${fmt(ep1.labor_subtotal)} │ ${fmt(ep2.labor_subtotal)} │ ${pct(ep2.labor_subtotal, ep1.labor_subtotal)} │`);
console.log(`│ Materials Total      │ ${fmt(ep1.materials_total)} │ ${fmt(ep2.materials_total)} │ ${pct(ep2.materials_total, ep1.materials_total)} │`);
console.log(`│ Painting Hours       │ ${ep1.production.painting_hours.toFixed(1).padStart(8)} │ ${ep2.production.painting_hours.toFixed(1).padStart(8)} │         │`);
console.log('└──────────────────────┴────────────┴────────────┴──────────┘');

console.log('\n─── PER-ITEM COMPARISON ─────────────────────────────');
for (let i = 0; i < Math.max(ep1.sections[0]?.items.length ?? 0, ep2.sections[0]?.items.length ?? 0); i++) {
  const i1 = ep1.sections[0]?.items[i];
  const i2 = ep2.sections[0]?.items[i];
  if (i1 && i2 && i1.label === i2.label) {
    const delta = i1.sales_price > 0 ? ((i2.sales_price - i1.sales_price) / i1.sales_price * 100).toFixed(0) : 'n/a';
    console.log(`  ${i1.label.padEnd(40)} v1=${fmt(i1.sales_price)} v2=${fmt(i2.sales_price)} (${delta}%)`);
  } else {
    if (i1) console.log(`  ${i1.label.padEnd(40)} v1=${fmt(i1.sales_price)}`);
    if (i2) console.log(`  ${''.padEnd(40)}              v2=${fmt(i2.sales_price)}`);
  }
}

// Surcharges
console.log('\n  Surcharges:');
for (const s of ep1.surcharges) {
  const s2 = ep2.surcharges.find(x => x.label === s.label);
  console.log(`  ${s.label.padEnd(40)} v1=${fmt(s.sales_amount)} v2=${s2 ? fmt(s2.sales_amount) : 'n/a'}`);
}

if (Math.abs(ep1.grand_total - ep2.grand_total) / ep1.grand_total < 0.15) {
  console.log(`\n✓ Epoxy engines within 15% (delta: ${pct(ep2.grand_total, ep1.grand_total).trim()})`);
} else {
  console.log(`\n✗ Epoxy engines diverge by ${pct(ep2.grand_total, ep1.grand_total).trim()} — needs tuning`);
}
