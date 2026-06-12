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
    'enabled_trades', 'output_format', 'labor_price_multiplier', 'show_losp',
    'crew_hourly_wage', 'default_crew_size', 'target_gross_margin', 'pricing_mode', 'metro_area',
    'sub_mode_enabled', 'sub_margin',
    'economy_of_scale_enabled', 'mobilization_hours', 'setup_hours_per_area',
  ];

  // logo_url is read back into filesystem paths by the PDF renderer — only the
  // exact shape upload-logo produces (or empty to clear) is allowed.
  if ('logo_url' in body && body.logo_url) {
    const valid = /^\/api\/logo\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}\.(png|jpe?g|webp|svg)$/i;
    if (typeof body.logo_url !== 'string' || !valid.test(body.logo_url)) {
      throw error(400, 'logo_url must come from the logo upload');
    }
  }

  // enabled_trades drives core navigation — reject junk before it lands
  if ('enabled_trades' in body) {
    let trades: unknown;
    try {
      trades = JSON.parse(body.enabled_trades);
    } catch {
      throw error(400, 'enabled_trades must be a JSON array');
    }
    const valid = ['interior', 'exterior', 'epoxy'];
    if (!Array.isArray(trades) || trades.length === 0 || !trades.every((t) => valid.includes(t))) {
      throw error(400, 'enabled_trades must include at least one of: interior, exterior, epoxy');
    }
  }

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  // prompts_shown is merge-only: a client dismissing one banner must never
  // clobber flags it doesn't know about (e.g. pricing_reviewed).
  if ('prompts_shown' in body) {
    const current = db.select({ prompts_shown: tenants.prompts_shown }).from(tenants)
      .where(eq(tenants.id, locals.user.tenant_id)).get();
    let existing: Record<string, unknown> = {};
    let incoming: Record<string, unknown> = {};
    try { existing = current?.prompts_shown ? JSON.parse(current.prompts_shown) : {}; } catch {}
    try { incoming = typeof body.prompts_shown === 'string' ? JSON.parse(body.prompts_shown) : body.prompts_shown ?? {}; } catch {}
    updates.prompts_shown = JSON.stringify({ ...existing, ...incoming });
  }

  db.update(tenants).set(updates).where(eq(tenants.id, locals.user.tenant_id)).run();

  // Invalidate cache
  const tenant = db.select().from(tenants).where(eq(tenants.id, locals.user.tenant_id)).get();
  if (tenant) invalidateTenantCache(tenant.slug);

  return json({ success: true });
};
