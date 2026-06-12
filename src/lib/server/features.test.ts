import { describe, it, expect } from 'vitest';
import { getAccessState } from './features.js';
import { tenant, tenantWith } from './test-fixtures.js';

const FUTURE = new Date(Date.now() + 7 * 86400000).toISOString();
const PAST = new Date(Date.now() - 86400000).toISOString();

describe('getAccessState — the tier matrix the endpoints enforce', () => {
	it('lifetime access gets everything', () => {
		const a = getAccessState(tenantWith({ lifetime_access: true }));
		expect(a.canGenerate).toBe(true);
		expect(a.canSendEmail).toBe(true);
		expect(a.canUseGoogleDocs).toBe(true);
		expect(a.canUseMultilingual).toBe(true);
	});

	it('active GQ ($49): generates branded PDFs, but no email/Docs/languages/analytics', () => {
		const a = getAccessState(tenantWith({
			lifetime_access: false, plan: 'gq', payment_status: 'active',
		}));
		expect(a.canGenerate).toBe(true);
		expect(a.canUseWhiteLabel).toBe(true);
		expect(a.canSendEmail).toBe(false);
		expect(a.canUseGoogleDocs).toBe(false);
		expect(a.canUseMultilingual).toBe(false);
		expect(a.canUseAnalytics).toBe(false);
		expect(a.maxUsers).toBe(1);
	});

	it('active Pro ($129): everything', () => {
		const a = getAccessState(tenantWith({
			lifetime_access: false, plan: 'gq_pro', payment_status: 'active',
		}));
		expect(a.canSendEmail).toBe(true);
		expect(a.canUseGoogleDocs).toBe(true);
		expect(a.canUseMultilingual).toBe(true);
		expect(a.canUseAnalytics).toBe(true);
		expect(a.maxUsers).toBe(3);
	});

	it('live trial gets Pro-level access', () => {
		const a = getAccessState(tenantWith({
			lifetime_access: false, plan: 'trial', payment_status: 'trialing', trial_ends_at: FUTURE,
		}));
		expect(a.isTrialing).toBe(true);
		expect(a.canGenerate).toBe(true);
		expect(a.canUseMultilingual).toBe(true);
	});

	it('expired trial is read-only (the gates the endpoints now enforce)', () => {
		const a = getAccessState(tenantWith({
			lifetime_access: false, plan: 'trial', payment_status: 'trialing', trial_ends_at: PAST,
		}));
		expect(a.canGenerate).toBe(false);
		expect(a.canSendEmail).toBe(false);
		expect(a.needsUpgrade).toBe(true);
	});

	it('canceled is read-only', () => {
		const a = getAccessState(tenantWith({
			lifetime_access: false, plan: 'gq', payment_status: 'canceled',
		}));
		expect(a.canGenerate).toBe(false);
		expect(a.needsUpgrade).toBe(true);
	});
});
