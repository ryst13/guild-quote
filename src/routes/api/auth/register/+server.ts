import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants, users } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { generateSlug } from '$lib/server/tenant.js';
import { createSession } from '$lib/server/auth.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json();
  const { company_name, first_name, last_name, email } = body;

  if (!company_name || !first_name || !last_name || !email) {
    return json({ error: 'All fields are required.' }, { status: 400 });
  }

  // Check if email already taken
  const existingUser = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existingUser) {
    return json({ error: 'An account with this email already exists. Try logging in.' }, { status: 400 });
  }

  // Create tenant
  const tenantId = uuidv4();
  const slug = generateSlug(company_name);

  db.insert(tenants).values({
    id: tenantId,
    slug,
    company_name,
    contact_email: email.toLowerCase(),
    primary_color: '#2563eb',
    accent_color: '#1e40af',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).run();

  // Create admin user
  const userId = uuidv4();
  db.insert(users).values({
    id: userId,
    tenant_id: tenantId,
    email: email.toLowerCase(),
    first_name,
    last_name,
    role: 'contractor_admin',
    created_at: new Date().toISOString(),
  }).run();

  // Create session
  const sessionId = createSession(userId);
  cookies.set('session_id', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60,
  });

  return json({ success: true, redirect: '/onboarding', slug });
};
