import { json } from '@sveltejs/kit';
import { findUserByEmail, createMagicLink } from '$lib/server/auth.js';
import { sendEmail, buildMagicLinkEmail } from '$lib/server/email.js';
import type { RequestHandler } from './$types.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export const POST: RequestHandler = async ({ request }) => {
  const { email } = await request.json();
  if (!email) return json({ error: 'Email is required.' }, { status: 400 });

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

  return json({ success: true, message: 'Check your email for a login link!' });
};
