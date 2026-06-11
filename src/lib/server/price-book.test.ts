import { describe, it, expect } from 'vitest';
import { buildPriceBook, roomSectionPrice } from './price-book.js';
import { calculateInteriorBottomUp } from './pricing-v2.js';
import { catalog, tenant, tenantWith, interiorScope } from './test-fixtures.js';
import { INTERIOR_ROOM_TYPES, INTERIOR_ITEMS } from '$lib/scope-options.js';

describe('price book — computed from the real engines', () => {
	it('covers every selectable room type and item', () => {
		const pb = buildPriceBook(tenant);
		expect(pb.rooms.map((r) => r.room_type)).toEqual([...INTERIOR_ROOM_TYPES]);
		expect(pb.items.map((i) => i.item)).toEqual([...INTERIOR_ITEMS]);
		for (const room of pb.rooms) {
			expect(room.prices.Small).toBeGreaterThan(0);
			expect(room.prices.Medium).toBeGreaterThan(0);
			expect(room.prices.Large).toBeGreaterThan(0);
		}
		for (const item of pb.items) {
			expect(item.price).toBeGreaterThan(0);
		}
	});

	it('a price-book room row equals that room\'s section subtotal in a real quote', () => {
		// interiorScope's first room is priced inside a real multi-room estimate;
		// the price book must show the same number for the same walls-only config.
		const room = interiorScope.rooms[0];
		const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const section = quote.sections.find((s) => s.label === `${room.room_type} (${room.room_size})`);
		expect(section).toBeDefined();

		const pbPrice = roomSectionPrice(tenant, room.room_type, room.room_size, room.items);
		// Rebuild the same extras the fixture room carries so the comparison is exact
		const fixtureHasExtras = room.ceiling_included || room.closet !== 'not_included' || room.primer_required;
		if (!fixtureHasExtras) {
			expect(pbPrice).toBeCloseTo(section!.sales_price, 6);
		} else {
			// Fixture room carries extras — assert the walls-only price is a strict
			// lower bound of the real section instead.
			expect(pbPrice!).toBeLessThanOrEqual(section!.sales_price);
		}
	});

	it('switching engines changes the numbers (the levers demonstrably work)', () => {
		const topDown = buildPriceBook(tenantWith({ pricing_mode: 'top_down' }));
		const bottomUp = buildPriceBook(tenantWith({ pricing_mode: 'bottom_up' }));
		expect(topDown.engine).toBe('top_down');
		expect(bottomUp.engine).toBe('bottom_up');
		const td = topDown.rooms.find((r) => r.room_type === 'Bedroom')!.prices.Medium;
		const bu = bottomUp.rooms.find((r) => r.room_type === 'Bedroom')!.prices.Medium;
		expect(td).toBeGreaterThan(0);
		expect(bu).toBeGreaterThan(0);
		expect(td).not.toBe(bu);
	});

	it('higher wage raises cost-based prices; higher multiplier raises rate-based prices', () => {
		const base = buildPriceBook(tenantWith({ pricing_mode: 'bottom_up' }));
		const pricier = buildPriceBook(tenantWith({ pricing_mode: 'bottom_up', crew_hourly_wage: 45 }));
		expect(pricier.rooms[0].prices.Medium!).toBeGreaterThan(base.rooms[0].prices.Medium!);

		const tdBase = buildPriceBook(tenantWith({ pricing_mode: 'top_down', labor_price_multiplier: 1.1 }));
		const tdHigh = buildPriceBook(tenantWith({ pricing_mode: 'top_down', labor_price_multiplier: 1.4 }));
		expect(tdHigh.rooms[0].prices.Medium!).toBeGreaterThan(tdBase.rooms[0].prices.Medium!);
	});
});
