import { json } from '@sveltejs/kit';
import { sqlite } from '$lib/server/db.js';
import type { RequestHandler } from './$types.js';

// Liveness probe for Fly's health check. Confirms the process is up and the
// SQLite file is openable; never touches tenant data.
export const GET: RequestHandler = () => {
  try {
    sqlite.prepare('SELECT 1').get();
    return json({ ok: true }, { status: 200 });
  } catch {
    return json({ ok: false }, { status: 503 });
  }
};
