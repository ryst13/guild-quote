import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(key, { apiVersion: '2025-03-31.basil' });
  }
  return _stripe;
}

// Price IDs — set these in .env after creating products in Stripe Dashboard
export function getPriceId(plan: 'gq' | 'gq_pro', interval: 'month' | 'year' = 'month'): string {
  if (plan === 'gq') {
    return interval === 'year'
      ? (env.STRIPE_PRICE_GQ_YEARLY || '')
      : (env.STRIPE_PRICE_GQ_MONTHLY || '');
  }
  return interval === 'year'
    ? (env.STRIPE_PRICE_PRO_YEARLY || '')
    : (env.STRIPE_PRICE_PRO_MONTHLY || '');
}

export function getWebhookSecret(): string {
  return env.STRIPE_WEBHOOK_SECRET || '';
}
