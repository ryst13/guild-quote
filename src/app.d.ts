import type { PaymentStatus, PlanTier } from '$lib/types/index.js';

declare global {
  namespace App {
    interface Locals {
      user?: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        role: 'contractor_admin' | 'contractor_staff';
        tenant_id: string | null;
        is_platform_admin: boolean;
      };
      tenant?: {
        id: string;
        slug: string;
        company_name: string;
        primary_color: string;
        accent_color: string;
        logo_url: string | null;
        plan: PlanTier;
        payment_status: PaymentStatus;
        lifetime_access: boolean;
        referral_code: string | null;
      };
      access?: {
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
      };
    }
  }
}

export {};
