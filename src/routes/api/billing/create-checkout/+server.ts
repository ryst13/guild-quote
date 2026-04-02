import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getStripe, getPriceId } from '$lib/server/stripe.js';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const body = await request.json();
  const plan = body.plan as 'gq' | 'gq_pro';
  const interval = (body.interval as 'month' | 'year') || 'month';

  if (!['gq', 'gq_pro'].includes(plan)) throw error(400, 'Invalid plan');

  const priceId = getPriceId(plan, interval);
  if (!priceId) throw error(500, 'Stripe price not configured for this plan');

  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (!tenant) throw error(404, 'Tenant not found');

  const stripe = getStripe();
  const baseUrl = env.PUBLIC_BASE_URL || url.origin;

  // Create or reuse Stripe customer
  let customerId = tenant.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: tenant.contact_email,
      name: tenant.company_name,
      metadata: { tenant_id: tenant.id },
    });
    customerId = customer.id;
    db.update(tenants).set({ stripe_customer_id: customerId }).where(eq(tenants.id, tenant.id)).run();
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/billing/cancel`,
    subscription_data: {
      metadata: { tenant_id: tenant.id, plan },
    },
    allow_promotion_codes: true,
  });

  return json({ url: session.url });
};
