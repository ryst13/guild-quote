import type { TenantConfig, PlanTier } from '$lib/types/index.js';

/**
 * Feature gating: determines what a tenant can access based on plan + billing status.
 */

interface AccessState {
  canGenerate: boolean;
  canSendEmail: boolean;
  canUseGoogleDocs: boolean;
  canUseWhiteLabel: boolean;
  canUseMultilingual: boolean;
  canUseAnalytics: boolean;
  maxUsers: number;
  isTrialing: boolean;
  trialDaysLeft: number;
  plan: PlanTier;
  needsUpgrade: boolean;
}

const FEATURE_MATRIX: Record<PlanTier, { maxUsers: number; googleDocs: boolean; email: boolean; whiteLabel: boolean; multilingual: boolean; analytics: boolean }> = {
  trial: { maxUsers: 3, googleDocs: true, email: true, whiteLabel: true, multilingual: true, analytics: true },
  gq: { maxUsers: 1, googleDocs: false, email: false, whiteLabel: false, multilingual: false, analytics: false },
  gq_pro: { maxUsers: 3, googleDocs: true, email: true, whiteLabel: true, multilingual: true, analytics: true },
};

export function getAccessState(tenant: TenantConfig): AccessState {
  // Lifetime access bypasses everything
  if (tenant.lifetime_access) {
    return {
      canGenerate: true, canSendEmail: true, canUseGoogleDocs: true,
      canUseWhiteLabel: true, canUseMultilingual: true, canUseAnalytics: true,
      maxUsers: 99, isTrialing: false, trialDaysLeft: 0,
      plan: 'gq_pro', needsUpgrade: false,
    };
  }

  const now = new Date();
  const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const isTrialing = tenant.payment_status === 'trialing' && trialEnd !== null && trialEnd > now;
  const trialDaysLeft = isTrialing && trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)) : 0;
  const trialExpired = tenant.payment_status === 'trialing' && trialEnd !== null && trialEnd <= now;

  const plan = tenant.plan || 'trial';
  const features = FEATURE_MATRIX[plan] || FEATURE_MATRIX.trial;

  // Active paid subscription
  if (tenant.payment_status === 'active') {
    return {
      canGenerate: true, canSendEmail: features.email, canUseGoogleDocs: features.googleDocs,
      canUseWhiteLabel: features.whiteLabel, canUseMultilingual: features.multilingual,
      canUseAnalytics: features.analytics, maxUsers: features.maxUsers,
      isTrialing: false, trialDaysLeft: 0, plan, needsUpgrade: false,
    };
  }

  // Active trial
  if (isTrialing) {
    const trialFeatures = FEATURE_MATRIX.trial;
    return {
      canGenerate: true, canSendEmail: trialFeatures.email, canUseGoogleDocs: trialFeatures.googleDocs,
      canUseWhiteLabel: trialFeatures.whiteLabel, canUseMultilingual: trialFeatures.multilingual,
      canUseAnalytics: trialFeatures.analytics, maxUsers: trialFeatures.maxUsers,
      isTrialing: true, trialDaysLeft, plan: 'trial', needsUpgrade: false,
    };
  }

  // Past due — grace period, limited generation
  if (tenant.payment_status === 'past_due') {
    return {
      canGenerate: true, canSendEmail: features.email, canUseGoogleDocs: features.googleDocs,
      canUseWhiteLabel: features.whiteLabel, canUseMultilingual: features.multilingual,
      canUseAnalytics: features.analytics, maxUsers: features.maxUsers,
      isTrialing: false, trialDaysLeft: 0, plan, needsUpgrade: false,
    };
  }

  // Canceled or trial expired — read-only
  if (tenant.payment_status === 'canceled' || trialExpired) {
    return {
      canGenerate: false, canSendEmail: false, canUseGoogleDocs: false,
      canUseWhiteLabel: false, canUseMultilingual: false, canUseAnalytics: false,
      maxUsers: 1, isTrialing: false, trialDaysLeft: 0, plan,
      needsUpgrade: true,
    };
  }

  // Default (new account, no trial set yet) — treat as needing upgrade
  return {
    canGenerate: false, canSendEmail: false, canUseGoogleDocs: false,
    canUseWhiteLabel: false, canUseMultilingual: false, canUseAnalytics: false,
    maxUsers: 1, isTrialing: false, trialDaysLeft: 0, plan,
    needsUpgrade: true,
  };
}
