// Generates the data-derived audit register CSVs in docs/audit/ by parsing
// the pricing engines and config defaults. Re-run after engine changes:
//   node scripts/audit-extract.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'docs/audit';
mkdirSync(OUT, { recursive: true });

const v2 = readFileSync('src/lib/server/pricing-v2.ts', 'utf8');
const v1 = readFileSync('src/lib/server/pricing.ts', 'utf8');
const catalog = JSON.parse(readFileSync('config/defaults/catalog.json', 'utf8'));
const thresholds = JSON.parse(readFileSync('config/defaults/thresholds.json', 'utf8'));

// Extract `NAME = {...}` (or `name: {...}`) object literal from TS source by
// brace matching, strip TS casts + comments, then evaluate as JS.
function extractObject(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error(`marker not found: ${marker}`);
  // Anchor on the assignment so type-annotation braces are skipped
  const start = src.indexOf('= {', idx) + 2;
  if (start === 1) throw new Error(`assignment not found after: ${marker}`);
  let depth = 0;
  let end = start;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') depth--;
    if (depth === 0) { end = i; break; }
  }
  let body = src.slice(start, end + 1);
  body = body.replace(/as Record<[^>]*>/g, '').replace(/\/\/[^\n]*/g, '');
  return new Function(`return (${body})`)();
}

const METRO_WAGES = extractObject(v2, 'const METRO_WAGES');
const PRODUCTION = extractObject(v2, 'const PRODUCTION');
const COMPLEXITY = extractObject(v2, 'const COMPLEXITY');
const COMPLEXITY_EPOXY = extractObject(v2, 'const COMPLEXITY_EPOXY');
const EPOXY_CONDITION_MOD = extractObject(v2, 'const EPOXY_CONDITION_MOD');
const CONDITION_MODIFIERS = extractObject(v2, 'const CONDITION_MODIFIERS');
const WALL_SQFT = extractObject(v2, 'const WALL_SQFT');
const CEILING_RATIO = extractObject(v2, 'const CEILING_RATIO');
const CLOSET_SQFT = extractObject(v2, 'const CLOSET_SQFT');
const INTERIOR_PAINT = extractObject(v2, 'const INTERIOR_PAINT');
const EXTERIOR_PAINT = extractObject(v2, 'const EXTERIOR_PAINT');
const INTERIOR_ITEM_SQFT = extractObject(v2, 'const INTERIOR_ITEM_SQFT');
const FIXED_SURCHARGES = extractObject(v2, 'const FIXED_SURCHARGES');
const EOS_DEFAULTS = extractObject(v2, 'const ECONOMY_OF_SCALE_DEFAULTS');

const INTERIOR_ITEM_RATES = extractObject(v1, 'const INTERIOR_ITEM_RATES');
const EXTERIOR_ITEM_RATES = extractObject(v1, 'const EXTERIOR_ITEM_RATES');
const INTERIOR_SURCHARGES = extractObject(v1, 'const INTERIOR_SURCHARGES');
const CARPENTRY_MATERIAL_PRICES = extractObject(v2, 'const CARPENTRY_MATERIAL_PRICES');
const EPOXY_COATING_RATES = extractObject(v1, 'const EPOXY_COATING_RATES');
const EPOXY_ADDON_RATES = extractObject(v1, 'const EPOXY_OPTIONS');

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function writeCsv(file, header, rows) {
  const lines = [header.join(',')];
  for (const r of rows) lines.push(header.map((h) => csvEscape(r[h])).join(','));
  writeFileSync(`${OUT}/${file}`, lines.join('\n') + '\n', 'utf8');
  console.log(`${file}: ${rows.length} rows`);
}
const pad = (n) => String(n).padStart(3, '0');

// ── 02: engine constants ────────────────────────────────────────
const HEADER = ['ID', 'Group', 'Item', 'Current Value', 'Units', 'Tenant Editable', 'Source', 'Flags', 'Decision', 'Target Value', 'Notes'];
const ec = [];
let n = 1;
const add = (group, item, value, units, editable, source, flags = '') =>
  ec.push({ ID: `EC-${pad(n++)}`, Group: group, Item: item, 'Current Value': value, Units: units, 'Tenant Editable': editable, Source: source, Flags: flags, Decision: '', 'Target Value': '', Notes: '' });

for (const [metro, w] of Object.entries(METRO_WAGES)) add('Metro wage defaults (BLS SOC 47-2141, May 2024)', metro, w, '$/hr', 'Indirect (picks default crew wage)', 'pricing-v2.ts METRO_WAGES');
add('Production rates (bottom-up)', 'Interior walls', PRODUCTION.interior_walls, 'sqft/hr/painter', 'No (hardcoded)', 'pricing-v2.ts PRODUCTION');
add('Production rates (bottom-up)', 'Interior ceiling', PRODUCTION.interior_ceiling, 'sqft/hr/painter', 'No (hardcoded)', 'pricing-v2.ts PRODUCTION');
add('Production rates (bottom-up)', 'Interior primer', PRODUCTION.interior_primer, 'sqft/hr/painter', 'No (hardcoded)', 'pricing-v2.ts PRODUCTION');
add('Production rates (bottom-up)', 'Exterior setup per surface (legacy)', PRODUCTION.exterior_setup_per_surface, 'hrs/surface', 'No (replaced by setup_hours_per_area when economy-of-scale is on)', 'pricing-v2.ts PRODUCTION');
for (const [k, v] of Object.entries(PRODUCTION.epoxy)) add('Production rates (epoxy)', k, v, k === 'cove_base' ? 'lf/hr' : 'sqft/hr', 'No (hardcoded)', 'pricing-v2.ts PRODUCTION.epoxy');
add('Top-down engine', 'Hourly rate (production-time math)', 40, '$/hr', 'No (hardcoded)', 'pricing.ts HOURLY_RATE');
add('Top-down engine', 'Wall rate (sub / sales)', '0.18 / 0.30', '$/sqft', 'Partially (labor multiplier scales sales)', 'pricing.ts WALL_RATE_*');
add('Top-down engine', 'Ceiling rate (sub / sales)', '0.15 / 0.25', '$/sqft', 'Partially (labor multiplier)', 'pricing.ts CEILING_RATE_*');
add('Top-down engine', 'Primer rate (sub / sales)', '0.10 / 0.16', '$/sqft', 'Partially (labor multiplier)', 'pricing.ts inline');
add('Top-down engine', 'Labor price multiplier', 1.1, 'x', 'Yes (settings/pricing)', 'tenants.labor_price_multiplier');
for (const [g, v] of Object.entries(INTERIOR_SURCHARGES.surface_grade)) add('Surface grade surcharge (top-down)', `Grade ${g} (sub / sales)`, `${v.sub_pct} / ${v.sales_pct}`, 'fraction', 'No (hardcoded)', 'pricing.ts INTERIOR_SURCHARGES');
for (const [g, v] of Object.entries(INTERIOR_SURCHARGES.prep_level)) add('Prep level surcharge (top-down)', `${g} (sub / sales)`, `${v.sub_pct} / ${v.sales_pct}`, 'fraction', 'No (hardcoded)', 'pricing.ts INTERIOR_SURCHARGES');
for (const [g, v] of Object.entries(CONDITION_MODIFIERS.surface_grade)) add('Surface grade modifier (bottom-up)', `Grade ${g}`, v, 'production speed x', 'No (hardcoded)', 'pricing-v2.ts CONDITION_MODIFIERS');
for (const [g, v] of Object.entries(CONDITION_MODIFIERS.prep_level)) add('Prep level modifier (bottom-up)', g, v, 'production speed x', 'No (hardcoded)', 'pricing-v2.ts CONDITION_MODIFIERS');
for (const [g, v] of Object.entries(EPOXY_CONDITION_MOD)) add('Epoxy condition modifier (bottom-up)', g, v, 'production speed x', 'No (hardcoded)', 'pricing-v2.ts EPOXY_CONDITION_MOD');
for (const [room, sizes] of Object.entries(WALL_SQFT)) add('Room wall sqft lookup', room, `${sizes.Small} / ${sizes.Medium} / ${sizes.Large}`, 'sqft (S/M/L)', 'No (hardcoded, duplicated in pricing.ts + pricing-v2.ts)', 'pricing-v2.ts WALL_SQFT');
for (const [room, r] of Object.entries(CEILING_RATIO)) add('Ceiling-to-wall ratio', room, r, 'ratio', 'No (hardcoded)', 'pricing-v2.ts CEILING_RATIO');
for (const [k, v] of Object.entries(CLOSET_SQFT)) add('Closet sqft', k, v, 'sqft', 'No (hardcoded)', 'pricing-v2.ts CLOSET_SQFT');
for (const [use, p] of Object.entries(INTERIOR_PAINT)) add('Paint defaults (interior)', `${use}: ${p.product}`, `${p.coverage} sqft/gal @ $${p.price_per_gallon}`, '', 'Yes (settings/pricing Materials tab via pricing_config)', 'pricing-v2.ts INTERIOR_PAINT', 'Engine hardcodes these; verify pricing_config materials actually feed the engines');
for (const [use, p] of Object.entries(EXTERIOR_PAINT)) add('Paint defaults (exterior)', `${use}: ${p.product}`, `${p.coverage} sqft/gal @ $${p.price_per_gallon}`, '', 'Yes (settings/pricing Materials tab via pricing_config)', 'pricing-v2.ts EXTERIOR_PAINT', 'Same verification needed');
add('Fixed surcharges', 'Color samples', FIXED_SURCHARGES.color_samples, '$', 'Yes (pricing_config)', 'pricing-v2.ts FIXED_SURCHARGES', 'Engine hardcodes; verify pricing_config wiring');
add('Fixed surcharges', 'CC fee', FIXED_SURCHARGES.cc_pct, 'fraction', 'Yes (pricing_config)', 'pricing-v2.ts FIXED_SURCHARGES', 'Same');
add('Fixed surcharges', 'Transportation', FIXED_SURCHARGES.transportation, '$', 'Yes (pricing_config)', 'pricing-v2.ts FIXED_SURCHARGES', 'Same');
add('Fixed surcharges', 'Trash (interior)', FIXED_SURCHARGES.trash_interior, '$', 'Yes (pricing_config)', 'pricing-v2.ts FIXED_SURCHARGES', 'Same');
add('Fixed surcharges', 'Trash (exterior)', FIXED_SURCHARGES.trash_exterior, '$', 'Yes (pricing_config)', 'pricing-v2.ts FIXED_SURCHARGES', 'Same');
add('Economy of scale', 'Mobilization hours default', EOS_DEFAULTS.mobilization_hours, 'crew-hrs/job', 'Yes (settings/pricing)', 'pricing-v2.ts ECONOMY_OF_SCALE_DEFAULTS', 'Calibrated vs RP data 2026-06-10');
add('Economy of scale', 'Setup hours per area default', EOS_DEFAULTS.setup_hours_per_area, 'crew-hrs/room or surface', 'Yes (settings/pricing)', 'pricing-v2.ts ECONOMY_OF_SCALE_DEFAULTS', '');
add('Engine defaults', 'Default gross margin', 0.40, 'fraction', 'Yes (settings/pricing)', 'pricing-v2.ts resolveSettings');
add('Engine defaults', 'Default crew size', 2, 'painters', 'Yes (settings/pricing)', 'pricing-v2.ts resolveSettings');
add('Profitability model', 'Material expense ratio', 0.80, 'fraction of materials_total', 'No (hardcoded)', 'pricing-v2.ts profitability');
add('Profitability model', 'Tax on gross profit', 0.25, 'fraction', 'No (hardcoded)', 'pricing-v2.ts profitability');
add('Profitability model', 'Overheads on gross profit', 0.12, 'fraction', 'No (hardcoded)', 'pricing-v2.ts profitability');
add('Materials', 'Wastage factor', 0.10, 'fraction', 'No (hardcoded)', 'pricing-v2.ts materials');
for (const [k, v] of Object.entries(thresholds)) add('Business thresholds (config/defaults/thresholds.json)', k, v, '', 'No UI (tenants.thresholds_json column exists but unused)', 'config/defaults/thresholds.json', 'Verify these are enforced anywhere');
add('Payment terms (output doc)', 'Deposit', '30%', '% of total', 'Settings field exists (deposit_pct) but output hardcodes 30%', 'estimate-templates.ts', 'FLAG: pricing_config.payment_terms may not be wired to the estimate output');
add('Payment terms (output doc)', 'Progress payment (jobs > $10k)', '30% at midpoint', '% of total', 'Settings field exists (progress_threshold) but output hardcodes $10k', 'estimate-templates.ts', 'Same flag');

writeCsv('02-engine-constants.csv', HEADER, ec);

// ── 03: scope items (the per-item economics register) ─────────
const IH = ['ID', 'Trade', 'Category', 'Item', 'Entry', 'TopDown $ (sales)', 'TopDown $ (sub)', 'BottomUp hrs/unit', 'Complexity factor', 'Sqft/unit', 'Material $ (carpentry)', 'Flags', 'Decision', 'Target Value', 'Notes'];
const items = [];
let m = 1;
const addItem = (r) => items.push({ ID: `ITEM-${pad(m++)}`, Flags: '', Decision: '', 'Target Value': '', Notes: '', ...r });

addItem({ Trade: 'Interior', Category: 'Area', Item: 'Walls', Entry: 'room type + size lookup', 'TopDown $ (sales)': '0.30/sqft', 'TopDown $ (sub)': '0.18/sqft', 'BottomUp hrs/unit': `sqft/${PRODUCTION.interior_walls}`, 'Complexity factor': COMPLEXITY.interior.walls, 'Sqft/unit': 'from WALL_SQFT' });
addItem({ Trade: 'Interior', Category: 'Area', Item: 'Ceiling', Entry: 'checkbox (per room)', 'TopDown $ (sales)': '0.25/sqft', 'TopDown $ (sub)': '0.15/sqft', 'BottomUp hrs/unit': `sqft/${PRODUCTION.interior_ceiling}`, 'Complexity factor': COMPLEXITY.interior.ceiling, 'Sqft/unit': 'wall sqft x ceiling ratio' });
addItem({ Trade: 'Interior', Category: 'Area', Item: 'Primer', Entry: 'checkbox (per room)', 'TopDown $ (sales)': '0.16/sqft', 'TopDown $ (sub)': '0.10/sqft', 'BottomUp hrs/unit': `sqft/${PRODUCTION.interior_primer}`, 'Complexity factor': COMPLEXITY.interior.primer, 'Sqft/unit': 'walls + ceiling' });
addItem({ Trade: 'Interior', Category: 'Area', Item: 'Closet (S/M/L)', Entry: 'dropdown (per room)', 'TopDown $ (sales)': '0.30/sqft', 'TopDown $ (sub)': '0.18/sqft', 'BottomUp hrs/unit': 'sqft/150 (as walls)', 'Complexity factor': 1.0, 'Sqft/unit': '48 / 64 / 96' });
for (const [name, rate] of Object.entries(INTERIOR_ITEM_RATES)) {
  addItem({ Trade: 'Interior', Category: name.split(' - ')[0], Item: name, Entry: 'quantity', 'TopDown $ (sales)': rate.sales_price, 'TopDown $ (sub)': rate.sub_cost, 'BottomUp hrs/unit': PRODUCTION.interior_items[name] ?? '', 'Complexity factor': COMPLEXITY.interior[name] ?? '', 'Sqft/unit': INTERIOR_ITEM_SQFT[name] ?? rate.sqft_per_unit });
}
for (const sp of ['Drywall Install', 'Floor Refinishing', 'Plaster Wall/Ceiling', 'Wallpaper', 'Window Cleaning', 'Room Cleaning']) {
  addItem({ Trade: 'Interior', Category: 'Specialty', Item: sp, Entry: 'checkbox (per room)', 'TopDown $ (sales)': 'NONE', 'TopDown $ (sub)': 'NONE', 'BottomUp hrs/unit': 'NONE', 'Complexity factor': '', 'Sqft/unit': '', Flags: 'NOT PRICED — collected on the form but ignored by both engines' });
}
const extCat = { siding: 'Siding', doors: 'Door', windows: 'Window', trim: 'Trim', carpentry_repairs: 'Carpentry repair' };
for (const [cat, rates] of Object.entries(EXTERIOR_ITEM_RATES)) {
  for (const [name, rate] of Object.entries(rates)) {
    const hrs = cat === 'siding' ? `${rate.sqft_per_unit} sqft @ ${PRODUCTION.exterior_siding[name] ?? '?'} sqft/hr` : PRODUCTION.exterior_items[name] ?? '';
    const cf = cat === 'siding' ? COMPLEXITY.exterior_siding[name] : COMPLEXITY.exterior[name];
    addItem({ Trade: 'Exterior', Category: extCat[cat] ?? cat, Item: name, Entry: cat === 'siding' ? 'quantity (squares, 1 sq = 200 sqft)' : 'quantity', 'TopDown $ (sales)': rate.sales_price, 'TopDown $ (sub)': '', 'BottomUp hrs/unit': hrs, 'Complexity factor': cf ?? '', 'Sqft/unit': rate.sqft_per_unit, 'Material $ (carpentry)': CARPENTRY_MATERIAL_PRICES[name] ?? rate.material_price ?? '' });
  }
}
for (const [name, rate] of Object.entries(EPOXY_COATING_RATES)) addItem({ Trade: 'Epoxy', Category: 'Coating', Item: name, Entry: 'dropdown + sqft', 'TopDown $ (sales)': `${rate}/sqft`, 'BottomUp hrs/unit': `sqft/${PRODUCTION.epoxy.coating}`, 'Complexity factor': COMPLEXITY_EPOXY[name] ?? '' });
for (const [name, rate] of Object.entries(EPOXY_ADDON_RATES)) addItem({ Trade: 'Epoxy', Category: 'Add-on', Item: name, Entry: 'checkbox / dropdown', 'TopDown $ (sales)': `${rate}/sqft or /lf`, 'BottomUp hrs/unit': PRODUCTION.epoxy[name] ? `sqft/${PRODUCTION.epoxy[name]}` : '', 'Complexity factor': COMPLEXITY_EPOXY[name] ?? '' });

writeCsv('03-scope-items.csv', IH, items);

// ── 04: catalog room pricing matrix (top-down catalog.json) ────
const surfaces = Object.keys(catalog.pricing[catalog.room_types[0]][catalog.room_sizes[0]]);
const CH = ['ID', 'Room Type', 'Size', ...surfaces, 'Decision', 'Target Values', 'Notes'];
const cr = [];
let c = 1;
for (const room of catalog.room_types) {
  for (const size of catalog.room_sizes) {
    const cell = catalog.pricing[room]?.[size] ?? {};
    cr.push({ ID: `CAT-${pad(c++)}`, 'Room Type': room, Size: size, ...Object.fromEntries(surfaces.map((s) => [s, cell[s] ?? ''])), Decision: '', 'Target Values': '', Notes: '' });
  }
}
writeCsv('04-catalog-room-pricing.csv', CH, cr);
