import { redirect } from '@sveltejs/kit';
import { getTenantById } from '$lib/server/tenant.js';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { resolveSurcharges } from '$lib/server/pricing-config.js';
import { getAccessState } from '$lib/server/features.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenant = getTenantById(locals.user.tenant_id);
  if (!tenant) throw redirect(303, '/auth/register');

  const promptsShown = tenant.prompts_shown ? JSON.parse(tenant.prompts_shown as string) : {};
  const scfg = resolveSurcharges(tenant);

  // Recent clients for one-tap prefill (deduped by name+address, newest first)
  const recent = db.select({
    first_name: submissions.first_name,
    last_name: submissions.last_name,
    email: submissions.email,
    phone: submissions.phone,
    address: submissions.address,
  }).from(submissions)
    .where(eq(submissions.tenant_id, locals.user.tenant_id))
    .orderBy(desc(submissions.created_at))
    .limit(30)
    .all();
  const seen = new Set<string>();
  const recentClients: { name: string; email: string; phone: string; address: string }[] = [];
  for (const r of recent) {
    const name = `${r.first_name} ${r.last_name}`.trim();
    const key = `${name}|${r.address}`.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    recentClients.push({ name, email: r.email || '', phone: r.phone || '', address: r.address || '' });
    if (recentClients.length >= 5) break;
  }

  return {
    recentClients,
    // Tell Marcos BEFORE the 4-step form, not at the 402 after it
    canGenerate: getAccessState(tenant).canGenerate,
    tenant: {
      company_name: tenant.company_name,
      enabled_trades: tenant.enabled_trades,
      primary_color: tenant.primary_color,
      output_format: tenant.output_format || 'google_docs',
      has_default_colors: tenant.primary_color === '#2563eb',
      has_contact_info: !!(tenant.contact_phone && tenant.contact_email),
    },
    surcharges: {
      color_samples: scfg.color_samples_enabled ? scfg.color_samples_amount : 0,
      transportation: scfg.transportation_enabled ? scfg.transportation_amount : 0,
    },
    prompts: {
      show_pricing: !promptsShown.pricing_reviewed,
      show_branding: !promptsShown.branding_customized && tenant.primary_color === '#2563eb',
    },
  };
};
