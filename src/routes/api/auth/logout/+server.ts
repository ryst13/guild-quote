import { json } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get('session_id');
  if (sessionId) {
    deleteSession(sessionId);
    cookies.delete('session_id', { path: '/' });
  }
  return json({ success: true });
};
