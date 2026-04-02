import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { invalidateTenantCache } from '$lib/server/tenant.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const body = await request.json();

  // Store the full pricing config as JSON, also update labor_price_multiplier on the tenant
  const updates: Record<string, unknown> = {
    pricing_config: JSON.stringify(body),
    updated_at: new Date().toISOString(),
  };

  if (body.labor_multiplier !== undefined) {
    updates.labor_price_multiplier = body.labor_multiplier;
  }

  db.update(tenants).set(updates).where(eq(tenants.id, locals.user.tenant_id)).run();

  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (tenant) invalidateTenantCache(tenant.slug);

  return json({ success: true });
};
