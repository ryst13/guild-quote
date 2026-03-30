import { runMigrations } from '$lib/server/migrate.js';
import { db } from '$lib/server/db.js';
import { sessions, users, tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

runMigrations();

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get('session_id');
  if (sessionId) {
    const session = db.select().from(sessions).where(eq(sessions.id, sessionId)).get();

    if (session && new Date(session.expires_at) > new Date()) {
      const user = db.select().from(users).where(eq(users.id, session.user_id)).get();

      if (user) {
        event.locals.user = {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role as 'contractor_admin' | 'contractor_staff' | 'homeowner',
          tenant_id: user.tenant_id,
        };

        if (user.tenant_id) {
          const tenant = db.select().from(tenants).where(eq(tenants.id, user.tenant_id)).get();
          if (tenant) {
            event.locals.tenant = {
              id: tenant.id,
              slug: tenant.slug,
              company_name: tenant.company_name,
              primary_color: tenant.primary_color,
              accent_color: tenant.accent_color,
              logo_url: tenant.logo_url,
            };
          }
        }
      }
    }
  }

  return resolve(event);
};
