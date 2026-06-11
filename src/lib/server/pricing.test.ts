import { describe, it, expect } from 'vitest';
import { calculateInteriorQuote, calculateExteriorQuote, calculateEpoxyQuote } from './pricing.js';
import { calculateInteriorBottomUp } from './pricing-v2.js';
import type { QuoteResult } from '$lib/types/index.js';
import {
	catalog,
	tenant,
	interiorScope,
	interiorRoomWithWindows,
	exteriorScope,
	epoxyScope,
} from './test-fixtures.js';

describe('top-down engine — structural invariants', () => {
	const cases: [string, () => QuoteResult, number][] = [
		['interior', () => calculateInteriorQuote(interiorScope, catalog, 1.1), interiorScope.rooms.length],
		['exterior', () => calculateExteriorQuote(exteriorScope, catalog, 1.1), exteriorScope.surfaces.length],
		['epoxy', () => calculateEpoxyQuote(epoxyScope, catalog, 1.1), epoxyScope.floors.length],
	];

	for (const [trade, run, sectionCount] of cases) {
		it(`${trade}: produces positive, finite grand_total`, () => {
			const q = run();
			expect(q.grand_total).toBeGreaterThan(0);
			expect(Number.isFinite(q.grand_total)).toBe(true);
		});

		it(`${trade}: one section per scope input`, () => {
			expect(run().sections).toHaveLength(sectionCount);
		});

		it(`${trade}: is deterministic`, () => {
			expect(run().grand_total).toBe(run().grand_total);
		});
	}
});

describe('top-down engine — monotonicity', () => {
	it('more identical rooms ⇒ higher total', () => {
		const one = calculateInteriorQuote(interiorRoomWithWindows(2, 1), catalog, 1.1);
		const four = calculateInteriorQuote(interiorRoomWithWindows(2, 4), catalog, 1.1);
		expect(four.grand_total).toBeGreaterThan(one.grand_total);
	});

	it('higher labor multiplier ⇒ higher total', () => {
		const lo = calculateInteriorQuote(interiorScope, catalog, 1.0);
		const hi = calculateInteriorQuote(interiorScope, catalog, 1.3);
		expect(hi.grand_total).toBeGreaterThan(lo.grand_total);
	});

	it('custom surcharge config flows through (and omitting it preserves defaults)', () => {
		const def = calculateInteriorQuote(interiorScope, catalog, 1.1);
		const custom = calculateInteriorQuote(interiorScope, catalog, 1.1, {
			trash_enabled: false, trash_interior: 50, trash_exterior: 225,
			transportation_enabled: true, transportation_amount: 50,
			cc_fee_enabled: true, cc_pct: 0.032,
			color_samples_enabled: true, color_samples_amount: 98.95,
		});
		expect(custom.surcharges.find((s) => s.label === 'Trash Removal')).toBeUndefined();
		expect(custom.grand_total).toBeLessThan(def.grand_total);
		expect(def.surcharges.find((s) => s.label === 'Trash Removal')!.sales_amount).toBe(50);
	});
});

describe('cross-engine sanity', () => {
	it('top-down and bottom-up land in the same ballpark for interior', () => {
		const td = calculateInteriorQuote(interiorScope, catalog, 1.1).grand_total;
		const bu = calculateInteriorBottomUp(interiorScope, catalog, tenant).grand_total;
		const ratio = td / bu;
		// Loose band — catches a wholly broken engine without over-constraining.
		expect(ratio).toBeGreaterThan(0.3);
		expect(ratio).toBeLessThan(3.0);
	});
});
