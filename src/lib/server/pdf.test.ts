import { describe, it, expect } from 'vitest';
import { generateEstimatePDF } from './pdf.js';
import { assembleInteriorEstimate } from './estimate-templates.js';
import { calculateInteriorBottomUp } from './pricing-v2.js';
import { catalog, tenant, tenantLite, interiorScope } from './test-fixtures.js';

describe('generateEstimatePDF', () => {
	it('renders a non-empty, valid PDF document', async () => {
		const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'SUB-PDF-1');
		const bytes = await generateEstimatePDF(doc, tenant);

		expect(bytes.length).toBeGreaterThan(1000);
		// PDF magic number.
		const header = Buffer.from(bytes.subarray(0, 5)).toString('latin1');
		expect(header.startsWith('%PDF')).toBe(true);
	});

	it('does not throw when the tenant logo is absent', async () => {
		const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'SUB-PDF-2');
		await expect(generateEstimatePDF(doc, { ...tenant, logo_url: null })).resolves.toBeDefined();
	});
});
