import { describe, it, expect } from 'vitest';
import { assembleInteriorEstimate, assembleExteriorEstimate, assembleEpoxyEstimate } from './estimate-templates.js';
import { calculateInteriorBottomUp, calculateExteriorBottomUp, calculateEpoxyBottomUp } from './pricing-v2.js';
import { catalog, tenant, tenantWith, tenantLite, interiorScope, exteriorScope, epoxyScope } from './test-fixtures.js';

describe('assembleInteriorEstimate', () => {
	const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);
	const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'SUB-INT-1');

	it('carries tenant branding into the header', () => {
		expect(doc.header.company_name).toBe(tenant.company_name);
		expect(doc.header.trade_label).toMatch(/interior/i);
	});

	it('has one recap row and one work-description block per room', () => {
		expect(doc.recap_table.rows).toHaveLength(interiorScope.rooms.length);
		expect(doc.work_description).toHaveLength(interiorScope.rooms.length);
	});

	it('reflects the selected surface grade and prep level', () => {
		expect(doc.surface_grade.selected).toBe('B');
		expect(doc.prep_level.selected).toBe('Standard');
	});

	it('produces positive money fields', () => {
		expect(doc.recap_table.grand_total).toBeGreaterThan(0);
		expect(doc.payment_terms.total).toBeGreaterThan(0);
		expect(doc.payment_terms.deposit_amount).toBeGreaterThan(0);
	});
});

describe('assembleExteriorEstimate', () => {
	const quote = calculateExteriorBottomUp(exteriorScope, catalog, tenant);
	const doc = assembleExteriorEstimate(exteriorScope, quote, tenantLite, 'SUB-EXT-1');

	it('carries tenant branding and positive totals', () => {
		expect(doc.header.company_name).toBe(tenant.company_name);
		expect(doc.recap_table.grand_total).toBeGreaterThan(0);
	});

	it('has one work-description block per surface', () => {
		expect(doc.work_description).toHaveLength(exteriorScope.surfaces.length);
	});
});

describe('specialty work — explicit exclusions, never silent', () => {
	const scopeWithSpecialty = () => {
		const s = JSON.parse(JSON.stringify(interiorScope)) as typeof interiorScope;
		s.rooms[0].specialty = ['Plaster Wall/Ceiling', 'Wallpaper'];
		return s;
	};

	it('checked specialties appear on the estimate as quoted-separately exclusions', () => {
		const scope = scopeWithSpecialty();
		const quote = calculateInteriorBottomUp(scope, catalog, tenant);
		const doc = assembleInteriorEstimate(scope, quote, tenantLite, 'SPEC-1');
		const bullets = doc.work_description[0].bullets.join(' | ');
		expect(bullets).toContain('Not included in this price (quoted separately)');
		expect(bullets).toContain('Plaster Wall/Ceiling');
		expect(bullets).toContain('Wallpaper');
	});

	it('specialties never change the price (no silent charges either way)', () => {
		const withSpec = calculateInteriorBottomUp(scopeWithSpecialty(), catalog, tenant);
		const without = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		expect(withSpec.grand_total).toBe(without.grand_total);
	});

	it('no exclusion bullet when nothing is checked', () => {
		const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'SPEC-2');
		expect(doc.work_description[0].bullets.join(' | ')).not.toContain('quoted separately');
	});
});

describe('recap table — rows track rooms even with Setup & Mobilization present', () => {
	it('exterior recap rows stay aligned under economy of scale too', () => {
		const eosTenant = tenantWith({ economy_of_scale_enabled: true });
		const quote = calculateExteriorBottomUp(exteriorScope, catalog, eosTenant);
		expect(quote.sections[0].label).toBe('Setup & Mobilization');
		const doc = assembleExteriorEstimate(exteriorScope, quote, tenantLite, 'RECAP-EXT');
		for (let i = 0; i < exteriorScope.surfaces.length; i++) {
			const surface = exteriorScope.surfaces[i];
			const section = quote.sections.find((s) => s.label === surface.name);
			expect(doc.recap_table.rows[i].price).toBeCloseTo(section!.sales_price, 6);
		}
	});

	it('economy-of-scale section does not shift recap prices onto wrong rooms', () => {
		const eosTenant = tenantWith({ economy_of_scale_enabled: true });
		const quote = calculateInteriorBottomUp(interiorScope, catalog, eosTenant);
		expect(quote.sections[0].label).toBe('Setup & Mobilization');
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'RECAP-1');
		// Each recap row's price must equal its own room's section price
		for (let i = 0; i < interiorScope.rooms.length; i++) {
			const room = interiorScope.rooms[i];
			const section = quote.sections.find(
				(s) => s.label === `${room.room_type} (${room.room_size})`,
			);
			expect(doc.recap_table.rows[i].price).toBeCloseTo(section!.sales_price, 6);
		}
	});
});

describe('payment terms — tenant config wiring', () => {
	const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);

	it('defaults: 30% deposit; progress only above $10k; percentages sum to 100%', () => {
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'PAY-1');
		const pt = doc.payment_terms;
		expect(pt.deposit_pct).toBe(0.30);
		if (quote.grand_total > 10000) {
			expect(pt.progress_pct).toBe(0.30);
			expect(pt.completion_pct).toBeCloseTo(0.40, 10);
		} else {
			expect(pt.progress_pct).toBeNull();
			expect(pt.completion_pct).toBeCloseTo(0.70, 10);
		}
		expect(pt.deposit_pct + (pt.progress_pct ?? 0) + pt.completion_pct).toBeCloseTo(1, 10);
		// Dollar rows must sum EXACTLY to the rounded total (no $1 drift)
		expect(pt.deposit_amount + (pt.progress_amount ?? 0) + pt.completion_amount).toBe(
			Math.round(pt.total),
		);
	});

	it('dollar schedule sums exactly to the rounded total across deposit configs', () => {
		for (const deposit_pct of [0.1, 0.3, 0.45, 0.6, 0.9]) {
			for (const progress_threshold of [0, 999999]) {
				const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'PAY-SUM', {
					deposit_pct,
					progress_threshold,
				});
				const pt = doc.payment_terms;
				expect(pt.deposit_amount + (pt.progress_amount ?? 0) + pt.completion_amount).toBe(
					Math.round(pt.total),
				);
				expect(pt.completion_amount).toBeGreaterThanOrEqual(0);
			}
		}
	});

	it('custom deposit percent flows into the schedule', () => {
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'PAY-2', {
			deposit_pct: 0.5,
			progress_threshold: 999999,
		});
		expect(doc.payment_terms.deposit_pct).toBe(0.5);
		expect(doc.payment_terms.progress_pct).toBeNull();
		expect(doc.payment_terms.completion_pct).toBeCloseTo(0.5, 10);
	});

	it('low threshold adds the progress payment; oversized deposit suppresses it', () => {
		const withProgress = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'PAY-3', {
			deposit_pct: 0.30,
			progress_threshold: 0,
		});
		expect(withProgress.payment_terms.progress_pct).toBe(0.30);
		expect(withProgress.payment_terms.completion_pct).toBeCloseTo(0.40, 10);

		const bigDeposit = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'PAY-4', {
			deposit_pct: 0.75,
			progress_threshold: 0,
		});
		expect(bigDeposit.payment_terms.progress_pct).toBeNull();
		expect(bigDeposit.payment_terms.completion_pct).toBeCloseTo(0.25, 10);
	});

	it('exterior assemble honors the same config', () => {
		const extQuote = calculateExteriorBottomUp(exteriorScope, catalog, tenant);
		const doc = assembleExteriorEstimate(exteriorScope, extQuote, tenantLite, 'PAY-5', {
			deposit_pct: 0.4,
			progress_threshold: 999999,
		});
		expect(doc.payment_terms.deposit_pct).toBe(0.4);
		expect(doc.payment_terms.completion_pct).toBeCloseTo(0.6, 10);
	});
});

describe('assembleEpoxyEstimate — epoxy gets the full 8-section document', () => {
	const quote = calculateEpoxyBottomUp(epoxyScope, catalog, tenant);
	const doc = assembleEpoxyEstimate(epoxyScope, quote, tenantLite, 'SUB-EP-1');

	it('one work-description block per floor with real scope content', () => {
		expect(doc.work_description.length).toBeGreaterThanOrEqual(epoxyScope.floors.length);
		const first = doc.work_description[0];
		expect(first.bullets.join(' | ')).toContain(epoxyScope.floors[0].coating_type);
		expect(first.bullets.join(' | ')).toContain('Floor condition');
	});

	it('recap rows carry each floor section price (never empty)', () => {
		expect(doc.recap_table.rows).toHaveLength(epoxyScope.floors.length);
		for (const row of doc.recap_table.rows) {
			expect(row.price).toBeGreaterThan(0);
		}
		expect(doc.recap_table.grand_total).toBeCloseTo(quote.grand_total, 6);
	});

	it('timeline and notes reach the output when present', () => {
		const scope = JSON.parse(JSON.stringify(epoxyScope)) as typeof epoxyScope;
		scope.project.timeline = 'before Thanksgiving';
		scope.project.notes = 'Gate code 4321';
		const q = calculateEpoxyBottomUp(scope, catalog, tenant);
		const d = assembleEpoxyEstimate(scope, q, tenantLite, 'SUB-EP-2');
		const all = d.work_description.map((w) => w.bullets.join(' ') + (w.notes ?? '')).join(' ');
		expect(all).toContain('before Thanksgiving');
		expect(all).toContain('Gate code 4321');
	});

	it('worst floor condition drives the displayed grade', () => {
		const scope = JSON.parse(JSON.stringify(epoxyScope)) as typeof epoxyScope;
		scope.floors[0].floor_condition = 'Poor';
		const q = calculateEpoxyBottomUp(scope, catalog, tenant);
		const d = assembleEpoxyEstimate(scope, q, tenantLite, 'SUB-EP-3');
		expect(d.surface_grade.selected).toBe('D');
	});

	it('payment schedule sums exactly to the rounded total', () => {
		const pt = doc.payment_terms;
		expect(pt.deposit_amount + (pt.progress_amount ?? 0) + pt.completion_amount).toBe(Math.round(pt.total));
	});
});
