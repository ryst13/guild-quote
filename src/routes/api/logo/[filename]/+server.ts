import { error } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { resolve, sep } from 'path';
import type { RequestHandler } from './$types.js';

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

// upload-logo writes `<tenant uuid>-<8 hex>.<ext>`; the character class admits no
// slash, backslash, or extra dot, so traversal can't even be expressed.
const FILENAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9a-f]{8}\.(png|jpe?g|webp|svg)$/i;

const LOGOS_ROOT = resolve('./data/logos');

export const GET: RequestHandler = async ({ params }) => {
  const name = params.filename;
  if (!FILENAME_RE.test(name)) throw error(404, 'Logo not found');

  const path = resolve(LOGOS_ROOT, name);
  if (!path.startsWith(LOGOS_ROOT + sep) || !existsSync(path)) {
    throw error(404, 'Logo not found');
  }

  const ext = name.split('.').pop()!.toLowerCase();

  return new Response(readFileSync(path), {
    headers: {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      // Sandboxes any legacy SVG logo: renders as an image, scripts inert
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
};
