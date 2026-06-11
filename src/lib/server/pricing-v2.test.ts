import { describe, it, expect } from 'vitest';
import {
	calculateInteriorBottomUp,
	calculateExteriorBottomUp,
	calculateEpoxyBottomUp,
} from './pricing-v2.js';
import type { QuoteResult, InteriorScopeData } from '$lib/types/index.js';
import {
	catalog,
	tenant,
	tenantWith,
	interiorScope,
	interiorRoomWithWindows,
	exteriorScope,
	epoxyScope,
} from './test-fixtures.js';

function findItem(q: QuoteResult, label: string) {
	for (const s of q.sections) {
		const hit = s.items.find((i) => i.label === label);
		if (hit) return hit;
	}
	return undefined;
}

function deepClone<T>(x: T): T {
	return JSON.parse(JSON.stringify(x));
}

describe('bottom-up engine — structural invariants', () => {
	const cases: [string, () => QuoteResult, number][] = [
		['interior', () => calculateInteriorBottomUp(interiorScope, catalog, tenant), interiorScope.rooms.length],
		['exterior', () => calculateExteriorBottomUp(exteriorScope, catalog, tenant), exteriorScope.surfaces.length],
		['epoxy', () => calculateEpoxyBottomUp(epoxyScope, catalog, tenant), epoxyScope.floors.length],
	];

	for (const [trade, run, sectionCount] of cases) {
		it(`${trade}: grand_total === labor_total + materials_total`, () => {
			const q = run();
			expect(q.grand_total).toBeCloseTo(q.labor_total + q.materials_total, 2);
		});

		it(`${trade}: produces positive totals and hours`, () => {
			const q = run();
			expect(q.grand_total).toBeGreaterThan(0);
			expect(Number.isFinite(q.grand_total)).toBe(true);
			expect(q.production.painting_hours).toBeGreaterThan(0);
		});

		it(`${trade}: one section per scope input`, () => {
			expect(run().sections).toHaveLength(sectionCount);
		});

		it(`${trade}: is deterministic`, () => {
			expect(run().grand_total).toBe(run().grand_total);
		});

		it(`${trade}: gross profit is positive`, () => {
			expect(run().profitability.gross_profit).toBeGreaterThan(0);
		});
	}
});

describe('bottom-up engine — pricing levers move the right way', () => {
	it('higher target margin ⇒ higher price', () => {
		const lo = calculateInteriorBottomUp(interiorScope, catalog, tenantWith({ target_gross_margin: 0.3 }));
		const hi = calculateInteriorBottomUp(interiorScope, catalog, tenantWith({ target_gross_margin: 0.5 }));
		expect(hi.grand_total).toBeGreaterThan(lo.grand_total);
	});

	it('higher crew wage ⇒ higher price', () => {
		const lo = calculateInteriorBottomUp(interiorScope, catalog, tenantWith({ crew_hourly_wage: 20 }));
		const hi = calculateInteriorBottomUp(interiorScope, catalog, tenantWith({ crew_hourly_wage: 40 }));
		expect(hi.grand_total).toBeGreaterThan(lo.grand_total);
	});

	it('worse surface grade (D) ⇒ higher price than pristine (A)', () => {
		const a = deepClone(interiorScope);
		a.project.surface_grade = 'A';
		const d = deepClone(interiorScope);
		d.project.surface_grade = 'D';
		expect(calculateInteriorBottomUp(d, catalog, tenant).grand_total).toBeGreaterThan(
			calculateInteriorBottomUp(a, catalog, tenant).grand_total,
		);
	});

	it('heavier prep (Restoration) ⇒ higher price than Basic', () => {
		const basic = deepClone(interiorScope);
		basic.project.prep_level = 'Basic';
		const resto = deepClone(interiorScope);
		resto.project.prep_level = 'Restoration';
		expect(calculateInteriorBottomUp(resto, catalog, tenant).grand_total).toBeGreaterThan(
			calculateInteriorBottomUp(basic, catalog, tenant).grand_total,
		);
	});
});

// ─────────────────────────────────────────────────────────────────────────
// CHARACTERIZATION TESTS — linear behavior with economy of scale DISABLED.
// The fixture tenant has economy_of_scale_enabled: false, so these lock the
// default path: it must stay byte-identical to the pre-feature engine
// (docs/economy-of-scale-pricing-spec.md §9, parity criterion).
// ─────────────────────────────────────────────────────────────────────────
describe('bottom-up engine — linearity (economy of scale disabled)', () => {
	it('per-unit window price is independent of quantity', () => {
		const small = calculateInteriorBottomUp(interiorRoomWithWindows(2), catalog, tenant);
		const large = calculateInteriorBottomUp(interiorRoomWithWindows(8), catalog, tenant);
		const w2 = findItem(small, 'Window - Standard Frame');
		const w8 = findItem(large, 'Window - Standard Frame');
		expect(w2).toBeDefined();
		expect(w8).toBeDefined();
		const perUnit2 = w2!.sales_price / w2!.quantity;
		const perUnit8 = w8!.sales_price / w8!.quantity;
		expect(perUnit8).toBeCloseTo(perUnit2, 4); // identical today; will drop once scale ships
	});

	it('labor scales exactly linearly with identical room count', () => {
		const one = calculateInteriorBottomUp(interiorRoomWithWindows(2, 1), catalog, tenant);
		const four = calculateInteriorBottomUp(interiorRoomWithWindows(2, 4), catalog, tenant);
		// labor_subtotal excludes flat surcharges, so 4 identical rooms == 4x one room.
		expect(four.labor_subtotal).toBeCloseTo(one.labor_subtotal * 4, 2);
	});
});

describe('bottom-up engine — economy of scale (Layer 1: Setup & Mobilization)', () => {
	const eosTenant = tenantWith({ economy_of_scale_enabled: true });
	// Fixture tenant resolves to Boston wage $28.50 and default 40% margin.
	const BILLING_RATE = 28.5 / (1 - 0.4);

	it('explicitly disabled ignores the hour knobs entirely (parity lock)', () => {
		const off = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const offWithKnobs = calculateInteriorBottomUp(
			interiorScope,
			catalog,
			tenantWith({ economy_of_scale_enabled: false, mobilization_hours: 99, setup_hours_per_area: 9 }),
		);
		expect(offWithKnobs.grand_total).toBe(off.grand_total);
		expect(offWithKnobs.sections).toHaveLength(off.sections.length);
	});

	it('enabled prepends a Setup & Mobilization section on all three trades', () => {
		const interior = calculateInteriorBottomUp(interiorScope, catalog, eosTenant);
		const exterior = calculateExteriorBottomUp(exteriorScope, catalog, eosTenant);
		const epoxy = calculateEpoxyBottomUp(epoxyScope, catalog, eosTenant);
		for (const q of [interior, exterior, epoxy]) {
			expect(q.sections[0].label).toBe('Setup & Mobilization');
			expect(q.sections[0].sales_price).toBeGreaterThan(0);
		}
	});

	it('interior: the line prices exactly mobilization + setup×rooms at the billing rate', () => {
		const off = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const on = calculateInteriorBottomUp(interiorScope, catalog, eosTenant);
		const hours = 3.5 + 0.5 * interiorScope.rooms.length;
		expect(on.labor_subtotal - off.labor_subtotal).toBeCloseTo(hours * BILLING_RATE, 2);
		expect(on.sections[0].items[0].allocated_time).toBeCloseTo(hours, 5);
	});

	it('tenant-edited mobilization hours move the line accordingly', () => {
		const lo = calculateInteriorBottomUp(interiorScope, catalog, tenantWith({ economy_of_scale_enabled: true, mobilization_hours: 2 }));
		const hi = calculateInteriorBottomUp(interiorScope, catalog, tenantWith({ economy_of_scale_enabled: true, mobilization_hours: 8 }));
		expect(hi.labor_subtotal - lo.labor_subtotal).toBeCloseTo(6 * BILLING_RATE, 2);
	});

	it('per-room labor decreases with job size, but the total still grows (monotonic sub-linear)', () => {
		const small = calculateInteriorBottomUp(interiorRoomWithWindows(2, 2), catalog, eosTenant);
		const large = calculateInteriorBottomUp(interiorRoomWithWindows(2, 8), catalog, eosTenant);
		expect(large.labor_subtotal / 8).toBeLessThan(small.labor_subtotal / 2);
		expect(large.grand_total).toBeGreaterThan(small.grand_total);
	});

	it('exterior: per-surface setup shrinks and the job-level block appears once', () => {
		const off = calculateExteriorBottomUp(exteriorScope, catalog, tenant);
		const on = calculateExteriorBottomUp(exteriorScope, catalog, eosTenant);
		const stagingOff = findItem(off, 'Setup & Staging');
		const stagingOn = findItem(on, 'Setup & Staging');
		expect(stagingOff!.allocated_time).toBeCloseTo(1.0, 5);
		expect(stagingOn!.allocated_time).toBeCloseTo(0.5, 5);
		expect(on.sections.filter((s) => s.label === 'Setup & Mobilization')).toHaveLength(1);
	});

	it('never unprofitable when enabled (guardrail)', () => {
		const quotes = [
			calculateInteriorBottomUp(interiorScope, catalog, eosTenant),
			calculateExteriorBottomUp(exteriorScope, catalog, eosTenant),
			calculateEpoxyBottomUp(epoxyScope, catalog, eosTenant),
		];
		for (const q of quotes) {
			expect(q.profitability.gross_profit).toBeGreaterThan(0);
			expect(q.grand_total).toBeGreaterThanOrEqual(
				q.profitability.labor_expense + q.profitability.material_expense,
			);
		}
	});
});

describe('bottom-up engine — tenant surcharge config (pricing_config wiring)', () => {
	const findSurcharge = (q: QuoteResult, label: string) =>
		q.surcharges.find((s) => s.label.startsWith(label));

	it('null pricing_config prices identically to a fully-default config object', () => {
		const off = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const withDefaults = calculateInteriorBottomUp(
			interiorScope,
			catalog,
			tenantWith({
				pricing_config: {
					surcharges: {
						trash_enabled: true, trash_interior: 50, trash_exterior: 225,
						transportation_enabled: true, transportation_amount: 50,
						cc_fee_enabled: true, cc_fee_pct: 3.2,
						color_samples_enabled: true, color_samples_amount: 98.95,
					},
				},
			}),
		);
		expect(withDefaults.grand_total).toBeCloseTo(off.grand_total, 6);
	});

	it('custom trash amount flows into the quote', () => {
		const q = calculateInteriorBottomUp(
			interiorScope,
			catalog,
			tenantWith({ pricing_config: { surcharges: { trash_interior: 120 } } }),
		);
		expect(findSurcharge(q, 'Trash Removal')!.sales_amount).toBe(120);
	});

	it('disabling trash removes the line and lowers the total', () => {
		const on = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const off = calculateInteriorBottomUp(
			interiorScope,
			catalog,
			tenantWith({ pricing_config: { surcharges: { trash_enabled: false } } }),
		);
		expect(findSurcharge(off, 'Trash Removal')).toBeUndefined();
		expect(off.grand_total).toBeLessThan(on.grand_total);
	});

	it('disabling the CC fee zeroes it across trades', () => {
		const cfg = tenantWith({ pricing_config: { surcharges: { cc_fee_enabled: false } } });
		for (const q of [
			calculateInteriorBottomUp(interiorScope, catalog, cfg),
			calculateExteriorBottomUp(exteriorScope, catalog, cfg),
		]) {
			expect(findSurcharge(q, 'CC Fee')).toBeUndefined();
			expect(q.grand_total).toBeCloseTo(q.labor_total + q.materials_total, 2);
		}
	});

	it('custom CC percent changes the fee and its label', () => {
		const q = calculateInteriorBottomUp(
			interiorScope,
			catalog,
			tenantWith({ pricing_config: { surcharges: { cc_fee_pct: 2.5 } } }),
		);
		const fee = findSurcharge(q, 'CC Fee');
		expect(fee!.label).toBe('CC Fee (2.5%)');
	});

	it('exterior trash uses the exterior amount; epoxy honors transportation config', () => {
		const ext = calculateExteriorBottomUp(
			exteriorScope,
			catalog,
			tenantWith({ pricing_config: { surcharges: { trash_exterior: 300 } } }),
		);
		expect(findSurcharge(ext, 'Trash Removal')!.sales_amount).toBe(300);
		const ep = calculateEpoxyBottomUp(
			epoxyScope,
			catalog,
			tenantWith({ pricing_config: { surcharges: { transportation_enabled: false } } }),
		);
		expect(findSurcharge(ep, 'Transportation')).toBeUndefined();
	});
});

describe('bottom-up engine — GAN validation deltas (epoxy)', () => {
	it('epoxy 500sqft garage prices in a sane band', () => {
		const q = calculateEpoxyBottomUp(epoxyScope, catalog, tenant);
		// Memory: epoxy validated at ~0% delta vs top-down on a 500sqft garage.
		// Assert a sane absolute band rather than a magic number.
		expect(q.grand_total).toBeGreaterThan(1500);
		expect(q.grand_total).toBeLessThan(12000);
	});
});
