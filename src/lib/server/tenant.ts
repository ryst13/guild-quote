import { db } from './db.js';
import { tenants } from './schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { TenantConfig, CatalogConfig, TradeType, PricingConfig } from '$lib/types/index.js';

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

function parsePricingConfig(raw: string | null): PricingConfig | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PricingConfig;
  } catch {
    return null;
  }
}

function buildTenantConfig(row: typeof tenants.$inferSelect): TenantConfig {
  let catalog: CatalogConfig = defaultCatalog;
  if (row.catalog_json) {
    try {
      catalog = JSON.parse(row.catalog_json);
    } catch {
      catalog = defaultCatalog;
    }
  }
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
    crew_hourly_wage: row.crew_hourly_wage ?? null,
    default_crew_size: row.default_crew_size ?? 2,
    target_gross_margin: row.target_gross_margin ?? null,
    pricing_mode: (row.pricing_mode as TenantConfig['pricing_mode']) || 'top_down',
    metro_area: row.metro_area ?? null,
    sub_mode_enabled: row.sub_mode_enabled ?? false,
    sub_margin: row.sub_margin ?? null,
    economy_of_scale_enabled: row.economy_of_scale_enabled ?? false,
    mobilization_hours: row.mobilization_hours ?? null,
    setup_hours_per_area: row.setup_hours_per_area ?? null,
    pricing_config: parsePricingConfig(row.pricing_config),
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
