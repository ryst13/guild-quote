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
// CHARACTERIZATION TESTS — current linear behavior (NO economy of scale).
// These lock today's behavior. When the economy-of-scale feature ships
// (docs/economy-of-scale-pricing-spec.md), these assertions must be UPDATED
// to expect sub-linear scaling — they are the regression baseline.
// ─────────────────────────────────────────────────────────────────────────
describe('bottom-up engine — linearity (no economy of scale yet)', () => {
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

describe('bottom-up engine — GAN validation deltas (epoxy)', () => {
	it('epoxy 500sqft garage prices in a sane band', () => {
		const q = calculateEpoxyBottomUp(epoxyScope, catalog, tenant);
		// Memory: epoxy validated at ~0% delta vs top-down on a 500sqft garage.
		// Assert a sane absolute band rather than a magic number.
		expect(q.grand_total).toBeGreaterThan(1500);
		expect(q.grand_total).toBeLessThan(12000);
	});
});
