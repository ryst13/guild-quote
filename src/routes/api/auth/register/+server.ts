import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants, users } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { generateSlug } from '$lib/server/tenant.js';
import { createSession } from '$lib/server/auth.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json();
  const { company_name, first_name, last_name, email } = body;
  const refCode = body.ref as string | undefined;

  if (!company_name || !first_name || !last_name || !email) {
    return json({ error: 'All fields are required.' }, { status: 400 });
  }

  // Check if email already taken
  const existingUser = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existingUser) {
    return json({ error: 'An account with this email already exists. Try logging in.' }, { status: 400 });
  }

  // Create tenant with 14-day trial
  const tenantId = uuidv4();
  const slug = generateSlug(company_name);
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const referralCode = randomBytes(4).toString('hex'); // 8-char unique code

  // Check for referrer
  let referredBy: string | null = null;
  if (refCode) {
    const referrer = db.select().from(tenants).where(eq(tenants.referral_code, refCode)).get();
    if (referrer) {
      referredBy = referrer.id;
      // Extend trial by 30 days for referred user
      trialEnd.setDate(trialEnd.getDate() + 30);
      // Credit the referrer
      db.update(tenants).set({
        referral_credits: (referrer.referral_credits || 0) + 1,
        // If referrer is on trial, extend their trial too
        ...(referrer.payment_status === 'trialing' && referrer.trial_ends_at ? {
          trial_ends_at: new Date(new Date(referrer.trial_ends_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } : {}),
        updated_at: now.toISOString(),
      }).where(eq(tenants.id, referrer.id)).run();
    }
  }

  db.insert(tenants).values({
    id: tenantId,
    slug,
    company_name,
    contact_email: email.toLowerCase(),
    primary_color: '#2563eb',
    accent_color: '#1e40af',
    trial_started_at: now.toISOString(),
    trial_ends_at: trialEnd.toISOString(),
    payment_status: 'trialing',
    plan: 'trial',
    referral_code: referralCode,
    referred_by: referredBy,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
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
