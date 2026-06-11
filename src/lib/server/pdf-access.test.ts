import { describe, it, expect } from 'vitest';
import { parsePdfFilename, canAccessPdf } from './pdf-access.js';

const UUID = 'd7e7166a-95a9-4ca8-9e47-99e2a5deb694';

describe('pdf-access — filename parsing (traversal-proof)', () => {
	it('accepts the three legitimate shapes', () => {
		expect(parsePdfFilename(UUID)).toEqual({ submissionId: UUID, filename: `${UUID}.pdf` });
		expect(parsePdfFilename(`${UUID}.pdf`)).toEqual({ submissionId: UUID, filename: `${UUID}.pdf` });
		expect(parsePdfFilename(`${UUID}-snapshot-es.pdf`)).toEqual({
			submissionId: UUID,
			filename: `${UUID}-snapshot-es.pdf`,
		});
		expect(parsePdfFilename(`${UUID}-snapshot-zh-yue.pdf`)?.submissionId).toBe(UUID);
	});

	it('rejects traversal and junk before any filesystem access', () => {
		for (const evil of [
			'..',
			'../secrets.pdf',
			'..\\..\\data\\guildquote.db',
			`${UUID}\\..\\..\\x.pdf`,
			'con.pdf',
			`${UUID}.PDF.exe`,
			'',
			'%2e%2e%2fsecrets.pdf',
		]) {
			expect(parsePdfFilename(evil)).toBeNull();
		}
	});
});

describe('pdf-access — ownership', () => {
	it('owner tenant can access; others cannot; admin can', () => {
		expect(canAccessPdf({ tenant_id: 'T1' }, 'T1')).toBe(true);
		expect(canAccessPdf({ tenant_id: 'T2' }, 'T1')).toBe(false);
		expect(canAccessPdf({ tenant_id: 'T2', is_platform_admin: true }, 'T1')).toBe(true);
		expect(canAccessPdf(null, 'T1')).toBe(false);
		expect(canAccessPdf({ tenant_id: null }, 'T1')).toBe(false);
	});
});
