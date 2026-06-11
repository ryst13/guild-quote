import { describe, it, expect } from 'vitest';
import { assembleInteriorEstimate, assembleExteriorEstimate } from './estimate-templates.js';
import { calculateInteriorBottomUp, calculateExteriorBottomUp } from './pricing-v2.js';
import { catalog, tenant, tenantLite, interiorScope, exteriorScope } from './test-fixtures.js';

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
