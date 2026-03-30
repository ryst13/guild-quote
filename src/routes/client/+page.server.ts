import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions, tenants } from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/auth/login');

  // Get all submissions for this user's email
  const subs = db.select().from(submissions)
    .where(eq(submissions.email, locals.user.email))
    .orderBy(desc(submissions.created_at))
    .all();

  // Group by tenant and enrich with tenant info
  const projects = subs.map(sub => {
    const tenant = getTenantById(sub.tenant_id);
    const quote = sub.quote_json ? JSON.parse(sub.quote_json) : null;
    const stage = tenant?.stages.find(s => s.key === sub.stage_key);

    return {
      id: sub.id,
      address: sub.address,
      sales_price: sub.sales_price,
      stage_key: sub.stage_key,
      stage_label: stage?.portal_client_label || sub.stage_key,
      assigned_crew: sub.assigned_crew,
      scheduled_start_date: sub.scheduled_start_date,
      estimate_pdf_url: sub.estimate_pdf_url,
      created_at: sub.created_at,
      company_name: tenant?.company_name || 'Unknown',
      primary_color: tenant?.primary_color || '#2563eb',
      stages: tenant?.stages || [],
    };
  });

  return { projects };
};
