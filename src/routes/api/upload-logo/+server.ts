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

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw error(400, 'Invalid file type. Use PNG, JPEG, SVG, or WebP.');
  }

  // Max 2MB
  if (file.size > 2 * 1024 * 1024) {
    throw error(400, 'File too large. Max 2MB.');
  }

  const ext = file.name.split('.').pop() || 'png';
  const filename = `${locals.user.tenant_id}-${randomUUID().slice(0, 8)}.${ext}`;

  mkdirSync('./data/logos', { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(`./data/logos/${filename}`, buffer);

  const logoUrl = `/api/logo/${filename}`;

  // Update tenant
  db.update(tenants)
    .set({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .where(eq(tenants.id, locals.user.tenant_id))
    .run();

  return json({ success: true, url: logoUrl });
};
