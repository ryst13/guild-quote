import { redirect } from '@sveltejs/kit';
import { google } from 'googleapis';
import { env } from '$env/dynamic/private';
import { randomUUID } from 'crypto';
import type { RequestHandler } from './$types.js';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
];

export const GET: RequestHandler = async ({ cookies }) => {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw redirect(303, '/auth/login?error=google_not_configured');
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // CSRF protection: the callback must echo this back
  const state = randomUUID();
  cookies.set('oauth_state', state, {
    path: '/auth',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state,
  });

  throw redirect(303, authUrl);
};
