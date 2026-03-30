import { writable } from 'svelte/store';
import type { IntakeFormData, RoomEntry } from '$lib/types/index.js';

export function createEmptyRoom(): RoomEntry {
  return {
    id: crypto.randomUUID(),
    room_type: 'Bedroom',
    room_name: '',
    room_size: 'Medium',
    ceiling_height: 'standard',
    surfaces: {
      walls: true,
      ceiling: false,
      trim: false,
      doors: 0,
      windows: 0,
      crown_molding: false,
      shelving: 0,
      cabinets: false,
    },
    condition: 'good',
    special_conditions: {
      wallpaper_removal: false,
      dark_to_light: false,
      textured_surfaces: false,
      wood_stain: false,
    },
    notes: '',
  };
}

export function createEmptyFormData(): IntakeFormData {
  return {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    rooms: [],
    occupancy: 'occupied',
    furniture: 'owner_moves',
    timeline: 'flexible',
    color_preference: 'not_sure',
    additional_notes: '',
  };
}

export const intakeForm = writable<IntakeFormData>(createEmptyFormData());
export const currentStep = writable(0);
