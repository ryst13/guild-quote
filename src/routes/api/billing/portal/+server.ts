import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getStripe } from '$lib/server/stripe.js';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, url }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (!tenant?.stripe_customer_id) throw error(400, 'No billing account found. Please subscribe first.');

  const stripe = getStripe();
  const baseUrl = env.PUBLIC_BASE_URL || url.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${baseUrl}/dashboard/settings/billing`,
  });

  return json({ url: session.url });
};
