import type { TenantConfig, QuoteResult, InteriorScopeData, ExteriorScopeData, EpoxyScopeData } from '$lib/types/index.js';
import { getTranslations, type SupportedLanguage } from './i18n.js';

export interface SnapshotDocument {
  header: {
    company_name: string;
    phone: string;
    email: string;
    date: string;
    reference: string;
    trade_label: string;
  };
  client: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  scope_summary: {
    trade: string;
    count_label: string;
    count: number;
    total_sqft: number;
  };
  scope_detail: {
    name: string;
    items: string[];
    notes: string;
  }[];
  production: {
    hours_low: number;
    hours_high: number;
    crew_size: number;
    days_low: number;
    days_high: number;
  };
  materials: {
    label: string;
    gallons: number;
    coverage: string;
  }[];
  scope_table: {
    headers: string[];
    rows: { cells: string[] }[];
  };
  estimator_notes: string;
  lang: SupportedLanguage;
  t: ReturnType<typeof getTranslations>;
}

export function assembleInteriorSnapshot(
  scope: InteriorScopeData,
  quote: QuoteResult,
  tenant: Pick<TenantConfig, 'company_name' | 'contact_phone' | 'contact_email'>,
  submissionId: string,
  notes: string,
  lang: SupportedLanguage = 'en',
): SnapshotDocument {
  const t = getTranslations(lang);
  const dateStr = new Date().toLocaleDateString(lang === 'zh-yue' ? 'zh-HK' : lang, { year: 'numeric', month: 'long', day: 'numeric' });

  const totalSqft = scope.rooms.reduce((sum, r) => {
    // Rough sqft from room items
    const itemCount = Object.values(r.items).reduce((a, b) => a + b, 0);
    return sum + itemCount * 50; // Approximate
  }, 0);

  const scopeDetail = scope.rooms.map(room => {
    const items: string[] = [];
    items.push(`${t.common.walls}: ${room.room_size}`);
    if (room.ceiling_included) items.push(t.common.ceiling);
    if (room.closet !== 'not_included') items.push(`${t.common.closet}: ${room.closet}`);
    if (room.primer_required) items.push(t.common.primer);
    for (const [key, val] of Object.entries(room.items)) {
      if (val > 0) items.push(`${key}: ${val}`);
    }
    return { name: room.room_type, items, notes: room.notes || '' };
  });

  const hours = quote.production.painting_hours;
  const days = quote.production.duration_days;

  return {
    header: {
      company_name: tenant.company_name,
      phone: tenant.contact_phone,
      email: tenant.contact_email,
      date: dateStr,
      reference: submissionId.slice(0, 8).toUpperCase(),
      trade_label: t.estimate.interior_painting,
    },
    client: {
      name: scope.client.name,
      address: scope.client.address,
      phone: scope.client.phone,
      email: scope.client.email,
    },
    scope_summary: {
      trade: t.estimate.interior_painting,
      count_label: t.snapshot.rooms,
      count: scope.rooms.length,
      total_sqft: totalSqft,
    },
    scope_detail: scopeDetail,
    scope_table: {
      headers: ['Room', 'Size', 'Walls', 'Ceiling', 'Closet', 'Primer', 'Notes'],
      rows: scope.rooms.map(room => ({
        cells: [
          room.room_type,
          room.room_size || '—',
          '✓',
          room.ceiling_included ? '✓' : '—',
          room.closet !== 'not_included' ? '✓' : '—',
          room.primer_required ? '✓' : '—',
          room.notes || '',
        ],
      })),
    },
    production: {
      hours_low: Math.max(1, Math.round(hours * 0.80)),
      hours_high: Math.max(Math.round(hours * 0.80) + 1, Math.round(hours * 1.20)),
      crew_size: quote.production.crew_size,
      days_low: Math.max(0.5, Math.round(days * 0.80 * 2) / 2),
      days_high: Math.max(Math.round(days * 0.80 * 2) / 2 + 0.5, Math.round(days * 1.20 * 2) / 2),
    },
    materials: quote.materials.map(m => ({
      label: m.label,
      gallons: m.gallons,
      coverage: `${m.gallons} ${t.common.gallons}`,
    })),
    estimator_notes: notes || '',
    lang,
    t,
  };
}

export function assembleExteriorSnapshot(
  scope: ExteriorScopeData,
  quote: QuoteResult,
  tenant: Pick<TenantConfig, 'company_name' | 'contact_phone' | 'contact_email'>,
  submissionId: string,
  notes: string,
  lang: SupportedLanguage = 'en',
): SnapshotDocument {
  const t = getTranslations(lang);
  const dateStr = new Date().toLocaleDateString(lang === 'zh-yue' ? 'zh-HK' : lang, { year: 'numeric', month: 'long', day: 'numeric' });

  const scopeDetail = scope.surfaces.map(surface => {
    const items: string[] = [];
    for (const [key, val] of Object.entries(surface.siding)) { if (val > 0) items.push(`${t.common.siding} — ${key}: ${val}`); }
    for (const [key, val] of Object.entries(surface.doors)) { if (val > 0) items.push(`${t.common.doors} — ${key}: ${val}`); }
    for (const [key, val] of Object.entries(surface.windows)) { if (val > 0) items.push(`${t.common.windows} — ${key}: ${val}`); }
    for (const [key, val] of Object.entries(surface.trim)) { if (val > 0) items.push(`${t.common.trim} — ${key}: ${val}`); }
    for (const [key, val] of Object.entries(surface.carpentry_repairs)) { if (val > 0) items.push(`${t.common.repairs} — ${key}: ${val}`); }
    return { name: surface.name, items, notes: surface.notes || '' };
  });

  const hours = quote.production.painting_hours;
  const days = quote.production.duration_days;

  return {
    header: {
      company_name: tenant.company_name,
      phone: tenant.contact_phone,
      email: tenant.contact_email,
      date: dateStr,
      reference: submissionId.slice(0, 8).toUpperCase(),
      trade_label: t.estimate.exterior_painting,
    },
    client: {
      name: scope.client.name,
      address: scope.client.address,
      phone: scope.client.phone,
      email: scope.client.email,
    },
    scope_summary: {
      trade: t.estimate.exterior_painting,
      count_label: t.snapshot.surfaces,
      count: scope.surfaces.length,
      total_sqft: 0,
    },
    scope_detail: scopeDetail,
    scope_table: {
      headers: ['Surface', 'Siding', 'Doors', 'Windows', 'Trim', 'Repairs', 'Notes'],
      rows: scope.surfaces.map(surface => {
        const hasSiding = Object.values(surface.siding).some(v => v > 0);
        const doorCount = Object.values(surface.doors).reduce((a, b) => a + b, 0);
        const windowCount = Object.values(surface.windows).reduce((a, b) => a + b, 0);
        const hasTrim = Object.values(surface.trim).some(v => v > 0);
        const hasRepairs = Object.values(surface.carpentry_repairs).some(v => v > 0);
        return {
          cells: [
            surface.name,
            hasSiding ? '✓' : '—',
            doorCount > 0 ? String(doorCount) : '—',
            windowCount > 0 ? String(windowCount) : '—',
            hasTrim ? '✓' : '—',
            hasRepairs ? '✓' : '—',
            surface.notes || '',
          ],
        };
      }),
    },
    production: {
      hours_low: Math.max(1, Math.round(hours * 0.80)),
      hours_high: Math.max(Math.round(hours * 0.80) + 1, Math.round(hours * 1.20)),
      crew_size: quote.production.crew_size,
      days_low: Math.max(0.5, Math.round(days * 0.80 * 2) / 2),
      days_high: Math.max(Math.round(days * 0.80 * 2) / 2 + 0.5, Math.round(days * 1.20 * 2) / 2),
    },
    materials: quote.materials.map(m => ({
      label: m.label,
      gallons: m.gallons,
      coverage: `${m.gallons} ${t.common.gallons}`,
    })),
    estimator_notes: notes || '',
    lang,
    t,
  };
}

export function assembleEpoxySnapshot(
  scope: EpoxyScopeData,
  quote: QuoteResult,
  tenant: Pick<TenantConfig, 'company_name' | 'contact_phone' | 'contact_email'>,
  submissionId: string,
  notes: string,
  lang: SupportedLanguage = 'en',
): SnapshotDocument {
  const t = getTranslations(lang);
  const dateStr = new Date().toLocaleDateString(lang === 'zh-yue' ? 'zh-HK' : lang, { year: 'numeric', month: 'long', day: 'numeric' });

  const totalSqft = scope.floors.reduce((s, f) => s + f.sqft, 0);
  const scopeDetail = scope.floors.map(floor => {
    const items: string[] = [
      `${floor.area_type} — ${floor.sqft} ${t.common.sqft}`,
      `Coating: ${floor.coating_type}`,
      `Condition: ${floor.floor_condition}`,
    ];
    if (floor.color_flake !== 'none') items.push(`Color flake: ${floor.color_flake}`);
    if (floor.cove_base) items.push(`Cove base: ${floor.cove_base_linear_feet} LF`);
    if (floor.existing_coating_removal) items.push('Existing coating removal');
    if (floor.moisture_issues) items.push('Moisture treatment');
    return { name: floor.area_type, items, notes: '' };
  });

  const hours = quote.production.painting_hours;
  const days = quote.production.duration_days;

  return {
    header: {
      company_name: tenant.company_name,
      phone: tenant.contact_phone,
      email: tenant.contact_email,
      date: dateStr,
      reference: submissionId.slice(0, 8).toUpperCase(),
      trade_label: t.estimate.epoxy_coatings,
    },
    client: {
      name: scope.client.name,
      address: scope.client.address,
      phone: scope.client.phone,
      email: scope.client.email,
    },
    scope_summary: {
      trade: t.estimate.epoxy_coatings,
      count_label: t.snapshot.floors,
      count: scope.floors.length,
      total_sqft: totalSqft,
    },
    scope_detail: scopeDetail,
    scope_table: {
      headers: ['Area', 'Sqft', 'Coating', 'Condition', 'Color Flake', 'Cove Base', 'Notes'],
      rows: scope.floors.map(floor => ({
        cells: [
          floor.area_type,
          String(floor.sqft),
          floor.coating_type,
          floor.floor_condition,
          floor.color_flake !== 'none' ? floor.color_flake : '—',
          floor.cove_base ? `${floor.cove_base_linear_feet} LF` : '—',
          '',
        ],
      })),
    },
    production: {
      hours_low: Math.max(1, Math.round(hours * 0.80)),
      hours_high: Math.max(Math.round(hours * 0.80) + 1, Math.round(hours * 1.20)),
      crew_size: quote.production.crew_size,
      days_low: Math.max(0.5, Math.round(days * 0.80 * 2) / 2),
      days_high: Math.max(Math.round(days * 0.80 * 2) / 2 + 0.5, Math.round(days * 1.20 * 2) / 2),
    },
    materials: quote.materials.map(m => ({
      label: m.label,
      gallons: m.gallons,
      coverage: `${m.gallons} ${t.common.gallons}`,
    })),
    estimator_notes: notes || '',
    lang,
    t,
  };
}
