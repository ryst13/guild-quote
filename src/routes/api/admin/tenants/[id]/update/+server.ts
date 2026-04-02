import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { invalidateTenantCache } from '$lib/server/tenant.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  if (!locals.user?.is_platform_admin) throw error(403, 'Admin access required');

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowedFields = [
    'lifetime_access', 'plan', 'payment_status',
    'trial_ends_at', 'referral_credits',
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  db.update(tenants).set(updates).where(eq(tenants.id, params.id)).run();

  const tenant = db.select().from(tenants).where(eq(tenants.id, params.id)).get();
  if (tenant) invalidateTenantCache(tenant.slug);

  return json({ success: true });
};
