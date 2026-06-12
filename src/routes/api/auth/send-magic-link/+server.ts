import { json } from '@sveltejs/kit';
import { findUserByEmail, createMagicLink } from '$lib/server/auth.js';
import { sendEmail, buildMagicLinkEmail } from '$lib/server/email.js';
import { rateLimit } from '$lib/server/rate-limit.js';
import type { RequestHandler } from './$types.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const { email } = await request.json();
  if (!email) return json({ error: 'Email is required.' }, { status: 400 });

  if (
    !rateLimit(`magic:ip:${getClientAddress()}`, 5, 10 * 60_000) ||
    !rateLimit(`magic:email:${String(email).toLowerCase()}`, 3, 10 * 60_000)
  ) {
    return json({ error: 'Too many login attempts. Wait 10 minutes and try again.' }, { status: 429 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    // Don't reveal whether account exists
    return json({ success: true, message: 'If an account exists with that email, a login link has been sent.' });
  }

  const token = createMagicLink(user.id);
  const loginUrl = `${BASE_URL}/auth/verify?token=${token}`;
  const html = buildMagicLinkEmail(user.first_name, loginUrl);

  const sent = await sendEmail({
    to: user.email,
    subject: 'Your GuildQuote login link',
    html,
  });

  // Dev fallback: with SMTP unconfigured the email is skipped, so surface the
  // link in the server terminal instead of silently dropping it.
  if (!sent && process.env.NODE_ENV !== 'production') {
    console.log('[auth] SMTP not configured — magic link for', user.email, ':', loginUrl);
  }

  // In production a failed send is a dead end — say so instead of lying
  if (!sent && process.env.NODE_ENV === 'production') {
    return json({ error: "The login email didn't send. Wait a minute and try again." }, { status: 502 });
  }

  return json({ success: true, message: 'Check your email for a login link!' });
};
