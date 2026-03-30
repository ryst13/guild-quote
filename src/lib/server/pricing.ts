import type { InteriorScopeData, ExteriorScopeData, EpoxyScopeData, QuoteResult, CatalogConfig } from '$lib/types/index.js';

// Stub implementations — will be fully built in pricing engine iterations
export function calculateInteriorQuote(formData: InteriorScopeData, catalog: CatalogConfig, multiplier: number = 1.1): QuoteResult {
  return emptyQuote('interior');
}

export function calculateExteriorQuote(formData: ExteriorScopeData, catalog: CatalogConfig, multiplier: number = 1.1): QuoteResult {
  return emptyQuote('exterior');
}

export function calculateEpoxyQuote(formData: EpoxyScopeData, catalog: CatalogConfig, multiplier: number = 1.1): QuoteResult {
  return emptyQuote('epoxy');
}

function emptyQuote(trade_type: 'interior' | 'exterior' | 'epoxy'): QuoteResult {
  return {
    trade_type,
    sections: [],
    labor_subtotal: 0,
    surcharges: [],
    labor_total: 0,
    materials: [],
    materials_total: 0,
    grand_total: 0,
    production: { painting_hours: 0, crew_size: 2, duration_days: 0 },
    profitability: {
      labor_income: 0,
      material_income: 0,
      total_price: 0,
      labor_expense: 0,
      material_expense: 0,
      gross_profit: 0,
      tax: 0,
      overheads: 0,
      net_profit: 0,
    },
    completeness_warnings: [],
  };
}
