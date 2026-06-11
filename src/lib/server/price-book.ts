import { calculateInteriorQuote } from './pricing.js';
import { calculateInteriorBottomUp } from './pricing-v2.js';
import { resolveSurcharges, resolveMaterials } from './pricing-config.js';
import { INTERIOR_ROOM_TYPES, ROOM_SIZES, INTERIOR_ITEMS } from '$lib/scope-options.js';
import type { TenantConfig, InteriorScopeData, QuoteResult, RoomSize } from '$lib/types/index.js';

// The Price Book never re-implements pricing: every figure below is read off a
// quote produced by the tenant's actual engine with the tenant's actual
// settings. Baseline scope per row: walls only, surface grade B, Standard
// prep, no ceiling/closet/extras — the page states this in plain words.

export interface PriceBookRoomRow {
  room_type: string;
  prices: Record<string, number | null>; // size -> rounded walls-only price
}

export interface PriceBookItemRow {
  item: string;
  price: number | null; // rounded price for one unit
}

export interface PriceBook {
  engine: 'top_down' | 'bottom_up';
  rooms: PriceBookRoomRow[];
  items: PriceBookItemRow[];
}

function baselineScope(
  roomType: string,
  roomSize: RoomSize,
  items: Record<string, number> = {},
): InteriorScopeData {
  return {
    client: { name: 'Price Book', address: '', email: '', phone: '', notes: '' },
    rooms: [{
      id: 'pb-room',
      room_type: roomType,
      room_size: roomSize,
      ceiling_included: false,
      closet: 'not_included',
      primer_required: false,
      items,
      specialty: [],
      notes: '',
    }],
    project: {
      surface_grade: 'B',
      prep_level: 'Standard',
      color_samples: false,
      transportation: false,
      notes: '',
    },
  };
}

function runEngine(tenant: TenantConfig, scope: InteriorScopeData): QuoteResult {
  if (tenant.pricing_mode === 'bottom_up') {
    return calculateInteriorBottomUp(scope, tenant.catalog, tenant);
  }
  return calculateInteriorQuote(scope, tenant.catalog, tenant.labor_price_multiplier, {
    surcharges: resolveSurcharges(tenant),
    materials: resolveMaterials(tenant),
  });
}

// Reads the single room's section subtotal — surcharges, materials, CC fees,
// and the Setup & Mobilization block live outside room sections, so this is
// exactly the room line a tenant sees in a real estimate's recap table.
export function roomSectionPrice(
  tenant: TenantConfig,
  roomType: string,
  roomSize: RoomSize,
  items: Record<string, number> = {},
): number | null {
  try {
    const scope = baselineScope(roomType, roomSize, items);
    const quote = runEngine(tenant, scope);
    const section = quote.sections.find((s) => s.label === `${roomType} (${roomSize})`);
    return section ? section.sales_price : null;
  } catch {
    return null;
  }
}

export function buildPriceBook(tenant: TenantConfig): PriceBook {
  const rooms: PriceBookRoomRow[] = INTERIOR_ROOM_TYPES.map((room_type) => {
    const prices: Record<string, number | null> = {};
    for (const size of ROOM_SIZES) {
      const p = roomSectionPrice(tenant, room_type, size);
      prices[size] = p == null ? null : Math.round(p);
    }
    return { room_type, prices };
  });

  // One unit of each item, priced as the delta over the same walls-only room —
  // identical to how it lands on a real estimate.
  const HOST_ROOM = 'Bedroom';
  const HOST_SIZE = 'Medium';
  const base = roomSectionPrice(tenant, HOST_ROOM, HOST_SIZE);
  const items: PriceBookItemRow[] = INTERIOR_ITEMS.map((item) => {
    const withItem = roomSectionPrice(tenant, HOST_ROOM, HOST_SIZE, { [item]: 1 });
    return {
      item,
      price: withItem == null || base == null ? null : Math.round(withItem - base),
    };
  });

  return {
    engine: tenant.pricing_mode === 'bottom_up' ? 'bottom_up' : 'top_down',
    rooms,
    items,
  };
}
