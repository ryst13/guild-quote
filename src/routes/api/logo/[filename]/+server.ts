import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import type { RequestHandler } from './$types.js';

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export const GET: RequestHandler = async ({ params }) => {
  const path = `./data/logos/${params.filename}`;
  if (!existsSync(path)) throw error(404, 'Logo not found');

  const ext = params.filename.split('.').pop()?.toLowerCase() || 'png';
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new Response(readFileSync(path), {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' },
  });
};
