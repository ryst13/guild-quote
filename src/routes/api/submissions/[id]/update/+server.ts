import { json, error } from '@sveltejs/kit';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db.js';
import { submissions } from '$lib/server/schema.js';
import { eq, and } from 'drizzle-orm';
import { getTenantById } from '$lib/server/tenant.js';
import { moveProjectToInactive } from '$lib/server/google-drive.js';
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
    'close_price', 'decline_reason', 'client_source', 'outcome_date', 'scope_json', 'quote_json',
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

  // If status changed to declined, move project folder from Active to Inactive
  if (body.estimate_status === 'declined') {
    try {
      const tenant = getTenantById(locals.user.tenant_id);
      const sub = db.select().from(submissions).where(eq(submissions.id, params.id)).get();
      if (tenant?.google_refresh_token && sub?.google_drive_project_folder_id &&
          tenant.google_drive_active_folder_id && tenant.google_drive_inactive_folder_id) {
        const clientId = env.GOOGLE_CLIENT_ID;
        const clientSecret = env.GOOGLE_CLIENT_SECRET;
        if (clientId && clientSecret) {
          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
          oauth2Client.setCredentials({ refresh_token: tenant.google_refresh_token });
          const drive = google.drive({ version: 'v3', auth: oauth2Client });
          await moveProjectToInactive(drive, sub.google_drive_project_folder_id, tenant.google_drive_active_folder_id, tenant.google_drive_inactive_folder_id);
        }
      }
    } catch (err) {
      console.warn('[update] Could not move project folder to Inactive:', err);
    }
  }

  return json({ success: true });
};
