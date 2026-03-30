import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { invalidateTenantCache } from '$lib/server/tenant.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user || (locals.user.role !== 'contractor_admin' && locals.user.role !== 'contractor_staff')) {
    throw error(401, 'Unauthorized');
  }
  if (!locals.user.tenant_id) throw error(400, 'No tenant associated');

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowedFields = [
    'company_name', 'contact_email', 'contact_phone', 'website_url',
    'service_areas', 'primary_color', 'accent_color', 'logo_url',
    'catalog_json', 'stages_json', 'thresholds_json', 'onboarding_completed',
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  db.update(tenants).set(updates).where(eq(tenants.id, locals.user.tenant_id)).run();

  // Invalidate cache
  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (tenant) invalidateTenantCache(tenant.slug);

  return json({ success: true });
};
