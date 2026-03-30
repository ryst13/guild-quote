import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  company_name: text('company_name').notNull(),
  logo_url: text('logo_url'),
  primary_color: text('primary_color').notNull().default('#2563eb'),
  accent_color: text('accent_color').notNull().default('#1e40af'),
  contact_email: text('contact_email').notNull(),
  contact_phone: text('contact_phone').notNull().default(''),
  website_url: text('website_url').notNull().default(''),
  service_areas: text('service_areas').notNull().default(''),
  catalog_json: text('catalog_json'),
  stages_json: text('stages_json'),
  thresholds_json: text('thresholds_json'),
  subscription_tier: text('subscription_tier').notNull().default('free'),
  onboarding_completed: integer('onboarding_completed', { mode: 'boolean' }).notNull().default(false),
  enabled_trades: text('enabled_trades').notNull().default('["interior"]'),
  google_refresh_token: text('google_refresh_token'),
  google_drive_folder_id: text('google_drive_folder_id'),
  output_format: text('output_format').notNull().default('google_docs'),
  labor_price_multiplier: real('labor_price_multiplier').notNull().default(1.1),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').references(() => tenants.id),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  google_id: text('google_id'),
  role: text('role', { enum: ['contractor_admin', 'contractor_staff'] }).notNull().default('contractor_admin'),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const magic_links = sqliteTable('magic_links', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expires_at: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => users.id),
  expires_at: text('expires_at').notNull(),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const submissions = sqliteTable('submissions', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  user_id: text('user_id').references(() => users.id),
  email: text('email').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  phone: text('phone'),
  address: text('address').notNull(),
  form_data: text('form_data').notNull(),
  scope_json: text('scope_json').notNull(),
  quote_json: text('quote_json'),
  sales_price: real('sales_price'),
  trade_type: text('trade_type').notNull().default('interior'),
  google_doc_url: text('google_doc_url'),
  estimate_status: text('estimate_status').notNull().default('draft'),
  estimator_notes: text('estimator_notes'),
  estimate_pdf_url: text('estimate_pdf_url'),
  assigned_crew: text('assigned_crew'),
  scheduled_start_date: text('scheduled_start_date'),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
