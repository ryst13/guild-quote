import { redirect, error } from '@sveltejs/kit';
import { google } from 'googleapis';
import { db } from '$lib/server/db.js';
import { users, tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { createSession } from '$lib/server/auth.js';
import { generateSlug } from '$lib/server/tenant.js';
import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  if (!code) throw error(400, 'Missing authorization code');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw error(500, 'Google OAuth not configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user info from Google
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.email) throw error(400, 'No email from Google');

  const googleId = profile.id || '';
  const email = profile.email.toLowerCase();
  const firstName = profile.given_name || '';
  const lastName = profile.family_name || '';

  // Check if user exists by google_id or email
  let user = db.select().from(users).where(eq(users.google_id, googleId)).get()
    || db.select().from(users).where(eq(users.email, email)).get();

  if (user) {
    // Update google_id if not set
    if (!user.google_id) {
      db.update(users).set({ google_id: googleId }).where(eq(users.id, user.id)).run();
    }
    // Store refresh token on tenant
    if (user.tenant_id && tokens.refresh_token) {
      db.update(tenants)
        .set({ google_refresh_token: tokens.refresh_token, updated_at: new Date().toISOString() })
        .where(eq(tenants.id, user.tenant_id))
        .run();
    }
  } else {
    // Create new tenant + user
    const tenantId = uuidv4();
    const slug = generateSlug(firstName ? `${firstName} ${lastName}` : email.split('@')[0]);

    db.insert(tenants).values({
      id: tenantId,
      slug,
      company_name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
      contact_email: email,
      google_refresh_token: tokens.refresh_token || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).run();

    const userId = uuidv4();
    db.insert(users).values({
      id: userId,
      tenant_id: tenantId,
      email,
      first_name: firstName,
      last_name: lastName,
      google_id: googleId,
      role: 'contractor_admin',
      created_at: new Date().toISOString(),
    }).run();

    user = db.select().from(users).where(eq(users.id, userId)).get()!;
  }

  // Create session
  const sessionId = createSession(user.id);
  cookies.set('session_id', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60,
  });

  // Check if onboarding needed
  if (user.tenant_id) {
    const tenant = db.select().from(tenants).where(eq(tenants.id, user.tenant_id)).get();
    if (tenant && !tenant.onboarding_completed) {
      throw redirect(303, '/onboarding');
    }
  }

  throw redirect(303, '/dashboard');
};
