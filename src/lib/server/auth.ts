import { db } from './db.js';
import { users, magic_links, sessions } from './schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { Role } from '$lib/types/index.js';

const MAGIC_LINK_EXPIRY_MINUTES = parseInt(process.env.MAGIC_LINK_EXPIRY_MINUTES || '15');
const SESSION_EXPIRY_DAYS = 30;

export function findOrCreateUser(
  email: string,
  firstName: string,
  lastName: string,
  role: Role = 'contractor_admin',
  tenantId: string | null = null
) {
  const existing = db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
  if (existing) return existing;

  const id = uuidv4();
  db.insert(users).values({
    id,
    email: email.toLowerCase(),
    first_name: firstName,
    last_name: lastName,
    phone: null,
    role,
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
  }).run();

  return db.select().from(users).where(eq(users.id, id)).get()!;
}

export function findUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
}

export function createMagicLink(userId: string): string {
  const id = uuidv4();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000).toISOString();

  db.insert(magic_links).values({
    id,
    user_id: userId,
    token,
    expires_at: expiresAt,
    used: false,
    created_at: new Date().toISOString(),
  }).run();

  return token;
}

export function verifyMagicLink(token: string): { userId: string } | null {
  const link = db.select().from(magic_links).where(eq(magic_links.token, token)).get();
  if (!link || link.used || new Date(link.expires_at) < new Date()) return null;

  db.update(magic_links).set({ used: true }).where(eq(magic_links.id, link.id)).run();
  return { userId: link.user_id };
}

export function createSession(userId: string): string {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.insert(sessions).values({
    id,
    user_id: userId,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  }).run();

  return id;
}

export function deleteSession(sessionId: string) {
  db.delete(sessions).where(eq(sessions.id, sessionId)).run();
}
