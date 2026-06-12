import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db.js';
import { tenants } from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Unauthorized');
  if (!locals.user.tenant_id) throw error(400, 'No tenant');

  const formData = await request.formData();
  const file = formData.get('logo') as File | null;
  if (!file) throw error(400, 'No file uploaded');

  // Max 2MB
  if (file.size > 2 * 1024 * 1024) {
    throw error(400, 'File too large. Max 2MB.');
  }

  // Trust the bytes, not the client-supplied type or filename. SVG is not
  // accepted: it can carry scripts, and the PDF renderer can't embed it anyway.
  const buffer = Buffer.from(await file.arrayBuffer());
  let ext: string;
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    ext = 'png';
  } else if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    ext = 'jpg';
  } else if (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    ext = 'webp';
  } else {
    throw error(400, 'That file is not a PNG, JPEG, or WebP image. Save your logo as PNG or JPEG and try again.');
  }

  const filename = `${locals.user.tenant_id}-${randomUUID().slice(0, 8)}.${ext}`;

  mkdirSync('./data/logos', { recursive: true });
  writeFileSync(`./data/logos/${filename}`, buffer);

  const logoUrl = `/api/logo/${filename}`;

  // Update tenant
  db.update(tenants)
    .set({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .where(eq(tenants.id, locals.user.tenant_id))
    .run();

  return json({ success: true, url: logoUrl });
};
