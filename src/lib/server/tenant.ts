import { db } from './db.js';
import { tenants } from './schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { TenantConfig, CatalogConfig, TradeType } from '$lib/types/index.js';

const defaultCatalog: CatalogConfig = JSON.parse(
  readFileSync(resolve('config/defaults/catalog.json'), 'utf-8')
);

export { defaultCatalog };

const tenantCache = new Map<string, { config: TenantConfig; cachedAt: number }>();
const CACHE_TTL_MS = 60_000;

export function getTenantBySlug(slug: string): TenantConfig | null {
  const cached = tenantCache.get(slug);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.config;

  const row = db.select().from(tenants).where(eq(tenants.slug, slug)).get();
  if (!row) return null;

  return buildTenantConfig(row);
}

export function getTenantById(id: string): TenantConfig | null {
  const row = db.select().from(tenants).where(eq(tenants.id, id)).get();
  if (!row) return null;

  return buildTenantConfig(row);
}

function buildTenantConfig(row: typeof tenants.$inferSelect): TenantConfig {
  const catalog: CatalogConfig = row.catalog_json ? JSON.parse(row.catalog_json) : defaultCatalog;
  let enabledTrades: TradeType[] = ['interior'];
  try {
    enabledTrades = JSON.parse(row.enabled_trades);
  } catch {}

  const config: TenantConfig = {
    id: row.id,
    slug: row.slug,
    company_name: row.company_name,
    logo_url: row.logo_url,
    primary_color: row.primary_color,
    accent_color: row.accent_color,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    website_url: row.website_url,
    service_areas: row.service_areas,
    enabled_trades: enabledTrades,
    labor_price_multiplier: row.labor_price_multiplier,
    output_format: row.output_format as 'google_docs' | 'pdf',
    google_refresh_token: row.google_refresh_token,
    google_drive_folder_id: row.google_drive_folder_id,
    google_drive_root_folder_id: row.google_drive_root_folder_id,
    google_drive_active_folder_id: row.google_drive_active_folder_id,
    google_drive_inactive_folder_id: row.google_drive_inactive_folder_id,
    catalog,
    show_losp: row.show_losp ?? true,
    stripe_customer_id: row.stripe_customer_id,
    payment_status: (row.payment_status as TenantConfig['payment_status']) || 'none',
    plan: (row.plan as TenantConfig['plan']) || 'trial',
    lifetime_access: row.lifetime_access ?? false,
    trial_ends_at: row.trial_ends_at,
    referral_code: row.referral_code,
    referral_credits: row.referral_credits ?? 0,
  };

  tenantCache.set(row.slug, { config, cachedAt: Date.now() });
  return config;
}

export function invalidateTenantCache(slug: string) {
  tenantCache.delete(slug);
}

export function generateSlug(companyName: string): string {
  let slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const existing = db.select().from(tenants).where(eq(tenants.slug, slug)).get();
  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  return slug;
}
