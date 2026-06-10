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
