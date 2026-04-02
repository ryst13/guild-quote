import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { unlinkSync } from 'fs';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const sub = db.select().from(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .get();
  if (!sub) throw error(404, 'Submission not found');

  // Delete PDF file if it exists
  try {
    unlinkSync(`./data/pdfs/${params.id}.pdf`);
  } catch {
    // File may not exist, that's fine
  }

  // Delete the record
  db.delete(submissions)
    .where(and(eq(submissions.id, params.id), eq(submissions.tenant_id, locals.user.tenant_id)))
    .run();

  return json({ success: true });
};
