export type Role = 'contractor_admin' | 'contractor_staff' | 'homeowner';

export type StageKey =
  | 'intake'
  | 'quote_sent'
  | 'under_review'
  | 'approved'
  | 'accepted'
  | 'scheduled'
  | 'in_progress'
  | 'closeout'
  | 'closed';

export type RoomSize = 'Small' | 'Medium' | 'Large';
export type CeilingHeight = 'standard' | 'tall' | 'vaulted';
export type Condition = 'good' | 'fair' | 'needs_work';
export type FurnitureHandling = 'owner_moves' | 'crew_moves' | 'stay_in_place';
export type Occupancy = 'occupied' | 'vacant' | 'partially_occupied';
export type Timeline = 'flexible' | 'within_2_weeks' | 'within_1_month' | 'specific_dates';
export type ColorPreference = 'know_colors' | 'need_help' | 'not_sure';

export interface RoomEntry {
  id: string;
  room_type: string;
  room_name: string;
  room_size: RoomSize;
  ceiling_height: CeilingHeight;
  surfaces: {
    walls: boolean;
    ceiling: boolean;
    trim: boolean;
    doors: number;
    windows: number;
    crown_molding: boolean;
    shelving: number;
    cabinets: boolean;
  };
  condition: Condition;
  special_conditions: {
    wallpaper_removal: boolean;
    dark_to_light: boolean;
    textured_surfaces: boolean;
    wood_stain: boolean;
  };
  notes: string;
}

export interface IntakeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  rooms: RoomEntry[];
  occupancy: Occupancy;
  furniture: FurnitureHandling;
  timeline: Timeline;
  timeline_dates?: string;
  color_preference: ColorPreference;
  additional_notes: string;
}

export interface RoomLineItem {
  room_id: string;
  room_label: string;
  base_price: number;
  modifiers: { label: string; amount: number }[];
  subtotal: number;
}

export interface QuoteResult {
  rooms: RoomLineItem[];
  subtotal: number;
  project_adders: { label: string; amount: number }[];
  total: number;
  assumptions: string[];
  exclusions: string[];
}

export interface Stage {
  id: number;
  key: StageKey;
  label: string;
  description: string;
  portal_client_label: string | null;
  gate_fields: string[];
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
  catalog: CatalogConfig;
  stages: Stage[];
  thresholds: ThresholdsConfig;
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

export interface ThresholdsConfig {
  auto_approve_max: number;
  requires_walkthrough_min: number;
  progress_payment_min: number;
  max_rooms_per_quote: number;
  deposit_percent: number;
}
