import type { IntakeFormData, RoomEntry, RoomLineItem, QuoteResult, CatalogConfig } from '$lib/types/index.js';

type PricingTable = Record<string, Record<string, Record<string, number>>>;

export function calculateQuote(formData: IntakeFormData, catalog: CatalogConfig): QuoteResult {
  const pricing = catalog.pricing as PricingTable;
  const roomLineItems: RoomLineItem[] = [];
  const assumptions: string[] = [
    'Room sizes are estimated from your selections (small/medium/large). Actual dimensions will be confirmed during a brief pre-project review.',
    'Standard surface preparation is included (cleaning, light sanding, filling small nail holes and minor imperfections).',
    'Two coats of premium-quality paint are included for all surfaces unless otherwise noted.',
    'Paint and materials are included in the quoted price.',
  ];
  const exclusions: string[] = [
    'Heavy plaster or drywall repair',
    'Lead paint abatement',
    'Mold or water damage remediation',
    'Exterior painting',
    'Specialty finishes (faux, metallic, Venetian plaster)',
  ];

  let wallpaperRoomCount = 0;
  let darkToLightRoomCount = 0;
  let needsWorkRoomCount = 0;

  for (const room of formData.rooms) {
    const item = calculateRoomPrice(room, pricing, catalog);
    roomLineItems.push(item);

    if (room.special_conditions.wallpaper_removal) wallpaperRoomCount++;
    if (room.special_conditions.dark_to_light) darkToLightRoomCount++;
    if (room.condition === 'needs_work') needsWorkRoomCount++;
  }

  const projectAdders: { label: string; amount: number }[] = [];

  const furnitureConfig = catalog.furniture_handling[formData.furniture];
  if (furnitureConfig && furnitureConfig.adder_per_room > 0) {
    const furnitureAdder = furnitureConfig.adder_per_room * formData.rooms.length;
    projectAdders.push({ label: `Furniture handling (${furnitureConfig.label})`, amount: furnitureAdder });
    assumptions.push(`Furniture ${formData.furniture === 'crew_moves' ? 'movement and covering by our crew' : 'protection while staying in place'} is included.`);
  }

  if (needsWorkRoomCount > 0) {
    assumptions.push(`Moderate surface preparation is included for ${needsWorkRoomCount} room${needsWorkRoomCount > 1 ? 's' : ''} marked as needing work. Heavy plaster repair, water damage remediation, or mold treatment are not included and will be quoted separately if found.`);
  }
  if (wallpaperRoomCount > 0) {
    assumptions.push(`Wallpaper removal is included for ${wallpaperRoomCount} room${wallpaperRoomCount > 1 ? 's' : ''}. If multiple layers or adhesive complications are found, additional charges may apply.`);
  }
  if (darkToLightRoomCount > 0) {
    assumptions.push(`Additional coats are included for significant color changes in ${darkToLightRoomCount} room${darkToLightRoomCount > 1 ? 's' : ''}.`);
  }

  const subtotal = roomLineItems.reduce((sum, r) => sum + r.subtotal, 0);
  const adderTotal = projectAdders.reduce((sum, a) => sum + a.amount, 0);

  return {
    rooms: roomLineItems,
    subtotal,
    project_adders: projectAdders,
    total: Math.round(subtotal + adderTotal),
    assumptions,
    exclusions,
  };
}

function calculateRoomPrice(room: RoomEntry, pricing: PricingTable, catalog: CatalogConfig): RoomLineItem {
  const roomType = room.room_type in pricing ? room.room_type : 'Other';
  const sizeKey = room.room_size;
  const priceTable = pricing[roomType]?.[sizeKey];

  if (!priceTable) {
    return { room_id: room.id, room_label: room.room_name || `${room.room_size} ${room.room_type}`, base_price: 0, modifiers: [], subtotal: 0 };
  }

  let basePrice = 0;
  const modifiers: { label: string; amount: number }[] = [];

  if (room.surfaces.walls) basePrice += priceTable.walls;
  if (room.surfaces.ceiling) basePrice += priceTable.ceiling;
  if (room.surfaces.trim) basePrice += priceTable.trim;
  if (room.surfaces.doors > 0) basePrice += priceTable.door * room.surfaces.doors;
  if (room.surfaces.windows > 0) basePrice += priceTable.window * room.surfaces.windows;
  if (room.surfaces.crown_molding) basePrice += priceTable.crown_molding;
  if (room.surfaces.shelving > 0) basePrice += priceTable.shelving * room.surfaces.shelving;
  if (room.surfaces.cabinets) basePrice += priceTable.cabinets;

  const heightConfig = catalog.ceiling_heights.find((h) => h.key === room.ceiling_height);
  if (heightConfig && heightConfig.multiplier !== 1.0) {
    const heightAdder = Math.round(basePrice * (heightConfig.multiplier - 1));
    modifiers.push({ label: `${heightConfig.label} ceiling`, amount: heightAdder });
  }

  if (room.condition === 'needs_work') {
    const condConfig = catalog.condition_levels.find((c) => c.key === 'needs_work');
    const pct = condConfig?.prep_adder_pct || 0.2;
    modifiers.push({ label: 'Additional prep (needs work)', amount: Math.round(basePrice * pct) });
  }

  if (room.special_conditions.wallpaper_removal) {
    modifiers.push({ label: 'Wallpaper removal', amount: catalog.special_conditions.wallpaper_removal.adder_per_room || 350 });
  }
  if (room.special_conditions.dark_to_light) {
    modifiers.push({ label: 'Dark-to-light color change', amount: Math.round(basePrice * (catalog.special_conditions.dark_to_light.adder_pct || 0.15)) });
  }
  if (room.special_conditions.textured_surfaces) {
    modifiers.push({ label: 'Textured surfaces', amount: Math.round(basePrice * (catalog.special_conditions.textured_surfaces.adder_pct || 0.10)) });
  }
  if (room.special_conditions.wood_stain) {
    modifiers.push({ label: 'Wood stain work', amount: Math.round(basePrice * (catalog.special_conditions.wood_stain.adder_pct || 0.20)) });
  }

  const modifierTotal = modifiers.reduce((sum, m) => sum + m.amount, 0);
  return {
    room_id: room.id,
    room_label: room.room_name || `${room.room_size} ${room.room_type}`,
    base_price: basePrice,
    modifiers,
    subtotal: basePrice + modifierTotal,
  };
}
