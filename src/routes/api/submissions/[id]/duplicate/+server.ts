import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const sub = db.select().from(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .get();
  if (!sub) throw error(404, 'Submission not found');

  const newId = uuidv4();
  const now = new Date().toISOString();

  db.insert(submissions).values({
    id: newId,
    tenant_id: sub.tenant_id,
    user_id: locals.user.id,
    email: sub.email,
    first_name: sub.first_name,
    last_name: sub.last_name,
    phone: sub.phone,
    address: sub.address,
    form_data: sub.form_data,
    scope_json: sub.scope_json,
    quote_json: sub.quote_json,
    sales_price: sub.sales_price,
    trade_type: sub.trade_type,
    estimate_status: 'draft',
    estimator_notes: sub.estimator_notes ? `Duplicated from ${params.id.slice(0, 8).toUpperCase()}. ${sub.estimator_notes}` : `Duplicated from ${params.id.slice(0, 8).toUpperCase()}.`,
    created_at: now,
    updated_at: now,
  }).run();

  return json({ success: true, id: newId });
};
