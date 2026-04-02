import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowedFields = [
    'sales_price', 'estimator_notes', 'estimate_status',
    'assigned_crew', 'scheduled_start_date',
    'first_name', 'last_name', 'email', 'phone', 'address',
    'close_price', 'decline_reason', 'client_source', 'outcome_date', 'scope_json',
  ];

  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  db.update(submissions)
    .set(updates)
    .where(and(
      eq(submissions.id, params.id),
      eq(submissions.tenant_id, locals.user.tenant_id)
    ))
    .run();

  return json({ success: true });
};
