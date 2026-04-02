import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) throw redirect(303, '/auth/login');
  if (!locals.user.tenant_id) throw redirect(303, '/auth/register');

  const tenantConfig = getTenantById(locals.user.tenant_id);
  if (!tenantConfig) throw redirect(303, '/auth/register');

  const sub = db.select().from(submissions)
    .where(and(
      eq(submissions.id, params.id),
      eq(submissions.tenant_id, locals.user.tenant_id)
    ))
    .get();

  if (!sub) throw error(404, 'Submission not found');

  const quote = sub.quote_json ? JSON.parse(sub.quote_json) : null;
  const tradeLabel = sub.trade_type === 'interior' ? 'Interior Painting' :
    sub.trade_type === 'exterior' ? 'Exterior Painting' : 'Epoxy & Garage Coatings';

  return {
    submission: {
      id: sub.id,
      first_name: sub.first_name,
      last_name: sub.last_name,
      email: sub.email,
      phone: sub.phone,
      address: sub.address,
      trade_type: sub.trade_type,
      sales_price: sub.sales_price,
      estimate_status: sub.estimate_status,
      google_doc_url: sub.google_doc_url,
      estimate_pdf_url: sub.estimate_pdf_url,
      grand_total: quote?.grand_total || sub.sales_price || 0,
    },
    tenant: {
      company_name: tenantConfig.company_name,
      contact_phone: tenantConfig.contact_phone,
      contact_email: tenantConfig.contact_email,
      primary_color: tenantConfig.primary_color,
      has_google: !!tenantConfig.google_refresh_token,
    },
    tradeLabel,
  };
};
