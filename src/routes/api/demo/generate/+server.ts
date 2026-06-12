import { json, error } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/rate-limit.js';
import { calculateInteriorQuote, calculateExteriorQuote, calculateEpoxyQuote } from '$lib/server/pricing.js';
import type { RequestHandler } from './$types.js';
import type { InteriorScopeData, ExteriorScopeData, EpoxyScopeData, TradeType } from '$lib/types/index.js';

// Demo endpoint: runs real pricing engines without auth, DB writes, or Google Docs
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!rateLimit(`demo:${getClientAddress()}`, 30, 60_000)) {
    throw error(429, 'Too many requests. Wait a minute and try again.');
  }

  const body = await request.json();
  const { trade_type, scope } = body as { trade_type: TradeType; scope: any };

  if (!trade_type || !scope) throw error(400, 'Missing trade_type or scope');

  // The dashboard UI caps rooms/surfaces at 16/8 — hold the public endpoint to
  // the same bound so it can't be used for CPU exhaustion
  const itemCount = (scope.rooms?.length ?? 0) + (scope.surfaces?.length ?? 0) + (scope.floors?.length ?? 0);
  if (itemCount > 24) throw error(400, 'Too many rooms or surfaces for the demo.');

  const emptyCatalog = { room_types: [], room_sizes: [], size_descriptions: {}, ceiling_heights: [], condition_levels: [], special_conditions: {}, furniture_handling: {}, pricing: {} };

  let quote;
  switch (trade_type) {
    case 'interior':
      quote = calculateInteriorQuote(scope as InteriorScopeData, emptyCatalog);
      break;
    case 'exterior':
      quote = calculateExteriorQuote(scope as ExteriorScopeData, emptyCatalog);
      break;
    case 'epoxy':
      quote = calculateEpoxyQuote(scope as EpoxyScopeData, emptyCatalog);
      break;
    default:
      throw error(400, 'Invalid trade type');
  }

  // Strip profitability data — demo viewers shouldn't see internal margins
  const { profitability, ...safeQuote } = quote;

  return json({
    success: true,
    quote: safeQuote,
  });
};
