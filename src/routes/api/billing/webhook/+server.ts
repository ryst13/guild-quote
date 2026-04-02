import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getStripe, getWebhookSecret } from '$lib/server/stripe.js';
import { invalidateTenantCache } from '$lib/server/tenant.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request }) => {
  const stripe = getStripe();
  const sig = request.headers.get('stripe-signature');
  const secret = getWebhookSecret();

  if (!sig || !secret) throw error(400, 'Missing signature or secret');

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err);
    throw error(400, 'Invalid signature');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tenantId = session.subscription
        ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata?.tenant_id
        : session.metadata?.tenant_id;

      if (tenantId) {
        const plan = session.metadata?.plan || 'gq';
        db.update(tenants).set({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          payment_status: 'active',
          plan,
          updated_at: new Date().toISOString(),
        }).where(eq(tenants.id, tenantId)).run();

        invalidateByTenantId(tenantId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const tenantId = sub.metadata?.tenant_id;
      if (tenantId) {
        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'canceled' ? 'canceled'
          : 'none';
        db.update(tenants).set({
          payment_status: status,
          plan: sub.metadata?.plan || 'gq',
          updated_at: new Date().toISOString(),
        }).where(eq(tenants.id, tenantId)).run();

        invalidateByTenantId(tenantId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const tenantId = sub.metadata?.tenant_id;
      if (tenantId) {
        db.update(tenants).set({
          payment_status: 'canceled',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).where(eq(tenants.id, tenantId)).run();

        invalidateByTenantId(tenantId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      const tenant = db.select().from(tenants).where(eq(tenants.stripe_customer_id, customerId)).get();
      if (tenant) {
        db.update(tenants).set({
          payment_status: 'past_due',
          updated_at: new Date().toISOString(),
        }).where(eq(tenants.id, tenant.id)).run();

        invalidateByTenantId(tenant.id);
      }
      break;
    }
  }

  return json({ received: true });
};

function invalidateByTenantId(tenantId: string) {
  const t = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
  if (t) invalidateTenantCache(t.slug);
}
