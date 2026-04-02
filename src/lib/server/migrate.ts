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
    enabled_trades TEXT NOT NULL DEFAULT '["interior"]',
    google_refresh_token TEXT,
    google_drive_folder_id TEXT,
    output_format TEXT NOT NULL DEFAULT 'google_docs',
    labor_price_multiplier REAL NOT NULL DEFAULT 1.1,
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
    google_id TEXT,
    role TEXT NOT NULL DEFAULT 'contractor_admin' CHECK(role IN ('contractor_admin', 'contractor_staff')),
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
    scope_json TEXT NOT NULL,
    quote_json TEXT,
    sales_price REAL,
    trade_type TEXT NOT NULL DEFAULT 'interior',
    google_doc_url TEXT,
    estimate_status TEXT NOT NULL DEFAULT 'draft',
    estimator_notes TEXT,
    estimate_pdf_url TEXT,
    assigned_crew TEXT,
    scheduled_start_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`
];

const alterations = [
  `ALTER TABLE tenants ADD COLUMN pricing_config TEXT`,
  `ALTER TABLE submissions ADD COLUMN version INTEGER NOT NULL DEFAULT 1`,
  `ALTER TABLE submissions ADD COLUMN previous_versions_json TEXT`,
  `ALTER TABLE submissions ADD COLUMN close_price REAL`,
  `ALTER TABLE submissions ADD COLUMN decline_reason TEXT`,
  `ALTER TABLE submissions ADD COLUMN client_source TEXT`,
  `ALTER TABLE submissions ADD COLUMN outcome_date TEXT`,
  `ALTER TABLE tenants ADD COLUMN prompts_shown TEXT DEFAULT '{}'`,
];

export function runMigrations() {
  for (const sql of migrations) {
    sqlite.exec(sql);
  }
  for (const sql of alterations) {
    try {
      sqlite.exec(sql);
    } catch {
      // Column already exists, ignore
    }
  }
}
