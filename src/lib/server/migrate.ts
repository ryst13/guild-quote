import { sqlite } from './db.js';

const migrations = [
  `CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT NOT NULL DEFAULT '#2563eb',
    accent_color TEXT NOT NULL DEFAULT '#1e40af',
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL DEFAULT '',
    website_url TEXT NOT NULL DEFAULT '',
    service_areas TEXT NOT NULL DEFAULT '',
    catalog_json TEXT,
    stages_json TEXT,
    thresholds_json TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    onboarding_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'homeowner' CHECK(role IN ('contractor_admin', 'contractor_staff', 'homeowner')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS magic_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    user_id TEXT REFERENCES users(id),
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT NOT NULL,
    form_data TEXT NOT NULL,
    rooms_json TEXT NOT NULL,
    quote_json TEXT,
    sales_price REAL,
    stage_key TEXT NOT NULL DEFAULT 'intake',
    estimator_notes TEXT,
    estimator_approved INTEGER DEFAULT 0,
    client_accepted INTEGER DEFAULT 0,
    estimate_pdf_url TEXT,
    assigned_crew TEXT,
    scheduled_start_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`
];

export function runMigrations() {
  for (const sql of migrations) {
    sqlite.exec(sql);
  }
}
