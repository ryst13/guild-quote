import { describe, it, expect } from 'vitest';
import { generateEstimatePDF } from './pdf.js';
import { assembleInteriorEstimate } from './estimate-templates.js';
import { calculateInteriorBottomUp } from './pricing-v2.js';
import { catalog, tenant, tenantWith, tenantLite, interiorScope } from './test-fixtures.js';

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

describe('pdf — tenant logo embed (happy path)', () => {
	it('renders with a real PNG logo without throwing and embeds bytes', async () => {
		// Self-sufficient fixture: 1x1 PNG written into the gitignored data dir
		const { mkdirSync, writeFileSync } = await import('fs');
		mkdirSync('./data/logos', { recursive: true });
		writeFileSync(
			'./data/logos/test-logo-fixture.png',
			Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'),
		);
		const quote = calculateInteriorBottomUp(interiorScope, catalog, tenant);
		const doc = assembleInteriorEstimate(interiorScope, quote, tenantLite, 'PDF-LOGO');
		const withoutLogo = await generateEstimatePDF(doc, tenant);
		const withLogo = await generateEstimatePDF(
			doc,
			tenantWith({ logo_url: '/api/logo/test-logo-fixture.png' }),
		);
		expect(withLogo.byteLength).toBeGreaterThan(0);
		// Embedded image must change the output size
		expect(withLogo.byteLength).not.toBe(withoutLogo.byteLength);
	});
});
