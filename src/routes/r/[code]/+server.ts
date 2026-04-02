import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, cookies }) => {
  // Store the referral code in a cookie so it persists through registration
  cookies.set('ref_code', params.code, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  throw redirect(303, `/auth/register?ref=${params.code}`);
};
