import { redirect } from '@sveltejs/kit';
import { verifyMagicLink, createSession } from '$lib/server/auth.js';
import { db } from '$lib/server/db.js';
import { users } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const token = url.searchParams.get('token');
  if (!token) throw redirect(303, '/auth/login?error=missing_token');

  const result = verifyMagicLink(token);
  if (!result) throw redirect(303, '/auth/login?error=invalid_token');

  const sessionId = createSession(result.userId);
  cookies.set('session_id', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60,
  });

  const user = db.select().from(users).where(eq(users.id, result.userId)).get();
  if (!user) throw redirect(303, '/auth/login');

  if (user.role === 'contractor_admin' || user.role === 'contractor_staff') {
    throw redirect(303, '/dashboard');
  }
  throw redirect(303, '/client');
};
