import { db } from './db.js';
import { tenants } from './schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { TenantConfig, CatalogConfig, Stage, ThresholdsConfig } from '$lib/types/index.js';

const defaultCatalog: CatalogConfig = JSON.parse(
  readFileSync(resolve('config/defaults/catalog.json'), 'utf-8')
);
const defaultStages: { stages: Stage[] } = JSON.parse(
  readFileSync(resolve('config/defaults/stages.json'), 'utf-8')
);
const defaultThresholds: ThresholdsConfig = JSON.parse(
  readFileSync(resolve('config/defaults/thresholds.json'), 'utf-8')
);

export { defaultCatalog, defaultStages, defaultThresholds };

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
  const stages: Stage[] = row.stages_json ? JSON.parse(row.stages_json).stages : defaultStages.stages;
  const thresholds: ThresholdsConfig = row.thresholds_json ? JSON.parse(row.thresholds_json) : defaultThresholds;

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
    catalog,
    stages,
    thresholds,
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
