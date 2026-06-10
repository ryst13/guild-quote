/**
 * Shared test fixtures: a full tenant, a minimal catalog (engines ignore it — `_catalog`),
 * and one scope per trade. Imported by the *.test.ts files. Not a test itself.
 */
import type {
	TenantConfig,
	CatalogConfig,
	ClientInfo,
	InteriorScopeData,
	ExteriorScopeData,
	EpoxyScopeData,
} from '$lib/types/index.js';

export const client: ClientInfo = {
	name: 'Jane Homeowner',
	email: 'jane@example.com',
	phone: '555-0100',
	address: '12 Maple St, Boston, MA',
	notes: '',
	source: 'test',
};

// Engines take `_catalog` and ignore it; a minimal object cast is sufficient.
export const catalog = {
	room_types: [],
	room_sizes: ['Small', 'Medium', 'Large'],
	size_descriptions: {},
	ceiling_heights: [],
	condition_levels: [],
	special_conditions: {},
	furniture_handling: {},
	pricing: {},
} as unknown as CatalogConfig;

export const tenant: TenantConfig = {
	id: 'tenant-test',
	slug: 'test-co',
	company_name: 'Test Painting Co.',
	logo_url: null,
	primary_color: '#1a3a5a',
	accent_color: '#2c6fb0',
	contact_email: 'hello@testco.com',
	contact_phone: '555-0199',
	website_url: 'https://testco.com',
	service_areas: 'Greater Boston',
	enabled_trades: ['interior', 'exterior', 'epoxy'],
	labor_price_multiplier: 1.1,
	output_format: 'pdf',
	google_refresh_token: null,
	google_drive_folder_id: null,
	google_drive_root_folder_id: null,
	google_drive_active_folder_id: null,
	google_drive_inactive_folder_id: null,
	catalog,
	show_losp: true,
	crew_hourly_wage: null, // ⇒ resolves from metro_area
	default_crew_size: 2,
	target_gross_margin: null, // ⇒ default 0.40
	pricing_mode: 'bottom_up',
	metro_area: 'boston',
	sub_mode_enabled: false,
	sub_margin: null,
	stripe_customer_id: null,
	payment_status: 'active',
	plan: 'gq_pro',
	lifetime_access: true,
	trial_ends_at: null,
	referral_code: null,
	referral_credits: 0,
};

/** Convenience: clone the tenant with overrides. */
export function tenantWith(overrides: Partial<TenantConfig>): TenantConfig {
	return { ...tenant, ...overrides };
}

export const tenantLite = {
	company_name: tenant.company_name,
	contact_phone: tenant.contact_phone,
	contact_email: tenant.contact_email,
	website_url: tenant.website_url,
};

export const interiorScope: InteriorScopeData = {
	client,
	rooms: [
		{
			id: 'r1',
			room_type: 'Master Bedroom',
			room_size: 'Large',
			ceiling_included: true,
			closet: 'medium',
			primer_required: false,
			items: { 'Window - Standard Frame': 2, 'Door - Frame Standard': 1, 'Trim - Baseboard/Crown': 1 },
			specialty: [],
			notes: '',
		},
		{
			id: 'r2',
			room_type: 'Bedroom',
			room_size: 'Medium',
			ceiling_included: true,
			closet: 'not_included',
			primer_required: false,
			items: { 'Window - Standard Frame': 2 },
			specialty: [],
			notes: '',
		},
		{
			id: 'r3',
			room_type: 'Bathroom',
			room_size: 'Small',
			ceiling_included: true,
			closet: 'not_included',
			primer_required: false,
			items: {},
			specialty: [],
			notes: '',
		},
	],
	project: { surface_grade: 'B', prep_level: 'Standard', color_samples: false, transportation: true, notes: '' },
};

/** A single interior room with a configurable window count — used for linearity tests. */
export function interiorRoomWithWindows(windowQty: number, roomCount = 1): InteriorScopeData {
	const room = {
		id: 'r1',
		room_type: 'Bedroom' as const,
		room_size: 'Medium' as const,
		ceiling_included: true,
		closet: 'not_included' as const,
		primer_required: false,
		items: { 'Window - Standard Frame': windowQty },
		specialty: [],
		notes: '',
	};
	return {
		client,
		rooms: Array.from({ length: roomCount }, (_, i) => ({ ...room, id: `r${i + 1}` })),
		project: { surface_grade: 'B', prep_level: 'Standard', color_samples: false, transportation: false, notes: '' },
	};
}

export const exteriorScope: ExteriorScopeData = {
	client,
	surfaces: [
		{
			id: 's1',
			name: 'Front Elevation',
			siding: { Clapboard: 4 },
			doors: { 'Standard Frame': 1 },
			windows: { Standard: 3 },
			trim: { 'Fascia (10ft)': 4 },
			carpentry_repairs: {},
			notes: '',
		},
		{
			id: 's2',
			name: 'Rear Elevation',
			siding: { Clapboard: 3 },
			doors: {},
			windows: { Standard: 2 },
			trim: {},
			carpentry_repairs: {},
			notes: '',
		},
	],
	project: {
		surface_grade: 'B',
		prep_level: 'Standard',
		color_scheme: '1-2 Colors',
		staging: false,
		color_samples: false,
		notes: '',
	},
};

export const epoxyScope: EpoxyScopeData = {
	client,
	floors: [
		{
			id: 'f1',
			area_type: 'Garage',
			sqft: 500,
			coating_type: 'Standard Epoxy',
			floor_condition: 'Good',
			existing_coating_removal: false,
			moisture_issues: false,
			color_flake: 'standard',
			cove_base: false,
			cove_base_linear_feet: 0,
		},
	],
	project: { concrete_grinding: true, crack_repair: 'none', timeline: '', notes: '' },
};
