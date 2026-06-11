// Single source of truth for interior scope options. The scope form and the
// Price Book both import these — they can never drift apart. The lists mirror
// the engines' WALL_SQFT / item-rate tables (pricing.ts, pricing-v2.ts).

export const INTERIOR_ROOM_TYPES = [
  'Kitchen', 'Living Room', 'Bedroom', 'Master Bedroom', 'Dining Room',
  'Bathroom', 'Full Bathroom', 'Foyer/Hallway', 'Closet', 'Den', 'Office',
  'Media Room', 'Eating Area', 'Pantry', 'Laundry Room', 'Utility/Mud Room',
  'Recreation Room', 'Family Room', 'Staircase Hallway',
] as const;

export const ROOM_SIZES = ['Small', 'Medium', 'Large'] as const;

export const INTERIOR_ITEMS = [
  'Window - Standard Frame', 'Window - Small Frame',
  'Door - Frame Standard', 'Door - Frame Double', 'Door - Flat',
  'Door - w/ Panels', 'Door - w/ Glass',
  'Trim - Baseboard/Crown', 'Trim - Wainscotting', 'Trim - Spindles/Balusters',
  'Trim - Radiator', 'Trim - Handrail',
  'Repair - Drywall Repair',
] as const;

export const INTERIOR_SPECIALTIES = [
  'Drywall Install', 'Floor Refinishing', 'Plaster Wall/Ceiling',
  'Wallpaper', 'Window Cleaning', 'Room Cleaning',
] as const;
