export type Role = 'contractor_admin' | 'contractor_staff';
export type TradeType = 'interior' | 'exterior' | 'epoxy';
export type EstimateStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';
export type SurfaceGrade = 'A' | 'B' | 'C' | 'D';
export type PrepLevel = 'Basic' | 'Standard' | 'Superior' | 'Restoration';
export type RoomSize = 'Small' | 'Medium' | 'Large';

// Interior scope types
export interface InteriorRoom {
  id: string;
  room_type: string;
  room_size: RoomSize;
  ceiling_included: boolean;
  closet: 'not_included' | 'small' | 'medium' | 'large';
  primer_required: boolean;
  items: Record<string, number>;
  specialty: string[];
  notes: string;
}

export interface InteriorScopeData {
  client: ClientInfo;
  rooms: InteriorRoom[];
  project: {
    surface_grade: SurfaceGrade;
    prep_level: PrepLevel;
    color_samples: boolean;
    transportation: boolean;
    notes: string;
  };
}

// Exterior scope types
export interface ExteriorSurface {
  id: string;
  name: string;
  siding: Record<string, number>;
  doors: Record<string, number>;
  windows: Record<string, number>;
  trim: Record<string, number>;
  carpentry_repairs: Record<string, number>;
  notes: string;
}

export interface ExteriorScopeData {
  client: ClientInfo;
  surfaces: ExteriorSurface[];
  project: {
    surface_grade: SurfaceGrade;
    prep_level: PrepLevel;
    color_scheme: '1-2 Colors' | '3 Colors' | '4 Colors';
    staging: boolean;
    color_samples: boolean;
    notes: string;
  };
}

// Epoxy scope types
export interface EpoxyFloor {
  id: string;
  area_type: string;
  sqft: number;
  coating_type: string;
  floor_condition: 'Good' | 'Fair' | 'Poor';
  existing_coating_removal: boolean;
  moisture_issues: boolean;
  color_flake: 'none' | 'standard' | 'full' | 'metallic';
  cove_base: boolean;
  cove_base_linear_feet: number;
}

export interface EpoxyScopeData {
  client: ClientInfo;
  floors: EpoxyFloor[];
  project: {
    concrete_grinding: boolean;
    crack_repair: 'none' | 'minor' | 'major';
    timeline: string;
    notes: string;
  };
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  source?: string;
}

// Quote result types
export interface LineItem {
  label: string;
  quantity: number;
  sub_cost: number;
  sales_price: number;
  allocated_time: number;
}

export interface SectionResult {
  label: string;
  items: LineItem[];
  sub_cost: number;
  sales_price: number;
}

export interface QuoteResult {
  trade_type: TradeType;
  sections: SectionResult[];
  labor_subtotal: number;
  surcharges: { label: string; sub_amount: number; sales_amount: number }[];
  labor_total: number;
  materials: { label: string; gallons: number; cost: number }[];
  materials_total: number;
  grand_total: number;
  production: {
    painting_hours: number;
    crew_size: number;
    duration_days: number;
  };
  profitability: {
    labor_income: number;
    material_income: number;
    total_price: number;
    labor_expense: number;
    material_expense: number;
    gross_profit: number;
    tax: number;
    overheads: number;
    net_profit: number;
  };
  benchmarks?: {
    percentile: string;
    message: string;
  };
  completeness_warnings: string[];
}

export interface TenantConfig {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  service_areas: string;
  enabled_trades: TradeType[];
  labor_price_multiplier: number;
  output_format: 'google_docs' | 'pdf';
  google_refresh_token: string | null;
  google_drive_folder_id: string | null;
  catalog: CatalogConfig;
}

export interface CatalogConfig {
  room_types: string[];
  room_sizes: string[];
  size_descriptions: Record<string, string>;
  ceiling_heights: { key: string; label: string; multiplier: number }[];
  condition_levels: { key: string; label: string; description: string; prep_adder?: number; prep_adder_pct?: number }[];
  special_conditions: Record<string, { label: string; adder_per_room?: number; adder_pct?: number }>;
  furniture_handling: Record<string, { label: string; adder_per_room: number }>;
  pricing: Record<string, Record<string, Record<string, number>>>;
}
