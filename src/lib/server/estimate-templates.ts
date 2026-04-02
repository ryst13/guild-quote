/**
 * Estimate Template Engine
 *
 * Ports Ryan Painting's Generator work description templates into GuildQuote.
 * Assembles per-room/surface narratives from scope data + prep tier.
 * Three prep tiers: Basic, Standard, Superior (+ Restoration as a variant of Superior).
 *
 * Source: RP Interior Generator PROD v3.1, Catalog tab rows 120-143
 */

import type {
  InteriorScopeData,
  ExteriorScopeData,
  EpoxyScopeData,
  QuoteResult,
  ClientInfo,
  SurfaceGrade,
  PrepLevel,
} from '$lib/types/index.js';

// ─── SURFACE GRADE DESCRIPTIONS ────────────────────────────────────

export const SURFACE_GRADE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  A: {
    label: 'New / Slightly Deteriorated',
    description:
      'The painted surfaces are in excellent condition with minimal wear. There is little to no peeling, cracking, or discoloration. Surfaces require only light cleaning before recoating. This is typical of recently painted homes or new construction.',
  },
  B: {
    label: 'Moderately Deteriorated',
    description:
      'The painted surfaces show moderate signs of wear including minor cracking, light peeling in high-moisture areas, and general fading. The substrate is structurally sound but requires preparation before recoating to ensure proper adhesion and longevity.',
  },
  C: {
    label: 'Severely Deteriorated',
    description:
      'The painted surfaces show significant deterioration including widespread cracking, peeling, and chalking. Multiple areas require scraping, sanding, and priming before new coatings can be applied. Additional preparation time and materials are reflected in the project pricing.',
  },
  D: {
    label: 'Damaged / Requires Repair',
    description:
      'The painted surfaces are extensively damaged with substrate-level issues including exposed wood, water damage, mold or mildew staining, and structural deterioration. Repair work is required before any painting can begin. This level typically involves carpentry repairs, skim coating, or other remediation.',
  },
};

// ─── PREP LEVEL DESCRIPTIONS ───────────────────────────────────────

export const PREP_LEVEL_DESCRIPTIONS: Record<string, { label: string; description: string; adjustment_label: string }> = {
  Basic: {
    label: 'Basic',
    description:
      'Basic preparation includes light dusting and cleaning of surfaces, minimal spot priming of exposed areas, and touch-up of visible imperfections. Appropriate for surfaces in good condition where a fresh coat of paint is the primary objective.',
    adjustment_label: '-7.5%',
  },
  Standard: {
    label: 'Standard',
    description:
      'Standard preparation includes thorough cleaning of all surfaces, sanding of glossy or uneven areas, filling of nail holes and minor imperfections with lightweight spackle, caulking of gaps at trim joints, and priming of all repaired areas and bare substrates. This level is appropriate for most residential repaints where the existing coating is in fair to good condition.',
    adjustment_label: 'Included',
  },
  Superior: {
    label: 'Superior',
    description:
      'Superior preparation includes all Standard-level work plus extensive sanding of all surfaces, removal of loose or failing coatings, skim coating of rough or uneven areas, full caulking of all joints and transitions, and a complete coat of primer on all surfaces before finish painting. Recommended for homes where surface quality is a priority.',
    adjustment_label: '+25%',
  },
  Restoration: {
    label: 'Restoration',
    description:
      'Restoration-grade preparation addresses surfaces with significant damage or historic character. Includes full stripping of failed coatings, repair or replacement of damaged substrate, extensive patching and skim coating, mold or stain treatment where needed, and multi-coat priming system. Required for properties with lead paint, historic plaster, or extensive prior deferred maintenance.',
    adjustment_label: '+37.5%',
  },
};

// ─── INTERIOR WORK DESCRIPTION TEMPLATES ───────────────────────────
// Per-item templates at each prep level. Assembled per room based on scope.

interface DescriptionTemplate {
  Basic: string;
  Standard: string;
  Superior: string;
  Restoration: string;
}

const INTERIOR_DESCRIPTIONS: Record<string, DescriptionTemplate> = {
  walls: {
    Basic: 'Light cleaning of wall surfaces and application of two coats of finish paint.',
    Standard: 'Clean and lightly sand all wall surfaces. Fill nail holes and minor imperfections. Apply two coats of finish paint for an even, lasting result.',
    Superior: 'Full preparation of all wall surfaces including thorough sanding, filling of all imperfections, skim coating of rough areas, and complete primer coat. Apply two coats of finish paint.',
    Restoration: 'Strip and remediate all failed coatings. Repair damaged substrate, skim coat as needed, and apply multi-coat primer system. Apply two coats of finish paint.',
  },
  ceiling: {
    Basic: 'Light cleaning and application of two coats of ceiling paint.',
    Standard: 'Lightly sand to smooth minor imperfections and clean surface dirt. Apply two coats of ceiling paint for a uniform finish.',
    Superior: 'Full sanding and preparation of ceiling surface. Fill cracks and imperfections, apply complete primer coat. Apply two coats of ceiling paint.',
    Restoration: 'Address all ceiling damage including cracking, peeling, and water staining. Repair substrate, apply stain-blocking primer, and two coats of ceiling paint.',
  },
  closet: {
    Basic: 'Light cleaning and one coat of paint to closet interior.',
    Standard: 'Clean and prepare closet interior surfaces. Apply two coats of paint to walls and trim.',
    Superior: 'Full preparation of closet interior including sanding, filling, and priming. Apply two coats of paint.',
    Restoration: 'Full remediation and repaint of closet interior including substrate repair.',
  },
  primer: {
    Basic: 'Spot prime exposed areas.',
    Standard: 'Prime all repaired areas and bare substrates to ensure proper adhesion of finish coats.',
    Superior: 'Apply complete coat of primer to all surfaces before finish painting.',
    Restoration: 'Apply multi-coat primer system including stain-blocking primer where needed.',
  },
  'Window - Standard Frame': {
    Basic: 'Light cleaning and two coats of paint to window frames.',
    Standard: 'Clean and lightly sand window frames. Caulk gaps where frame meets wall. Apply two coats of paint.',
    Superior: 'Full preparation of window frames including sanding, scraping of loose paint, caulking, and priming. Apply two coats of paint.',
    Restoration: 'Strip failed coatings from window frames. Repair glazing and damaged wood. Prime and apply two coats of paint.',
  },
  'Window - Small Frame': {
    Basic: 'Light cleaning and two coats of paint to small window frames.',
    Standard: 'Clean and lightly sand small window frames. Caulk gaps and apply two coats of paint.',
    Superior: 'Full preparation of small window frames including sanding, caulking, and priming. Apply two coats of paint.',
    Restoration: 'Strip and repair small window frames. Prime and apply two coats of paint.',
  },
  'Door - Frame Standard': {
    Basic: 'Light cleaning and two coats of paint to door frames.',
    Standard: 'Clean and lightly sand door frames. Fill imperfections and apply two coats of paint for a refined finish.',
    Superior: 'Full preparation of door frames including sanding, filling, and priming. Apply two coats of paint.',
    Restoration: 'Strip and repair door frames. Full prime and two coats of paint.',
  },
  'Door - Frame Double': {
    Basic: 'Light cleaning and two coats of paint to double door frames.',
    Standard: 'Clean and lightly sand double door frames. Fill imperfections and apply two coats of paint.',
    Superior: 'Full preparation of double door frames including sanding, filling, and priming. Apply two coats of paint.',
    Restoration: 'Strip and repair double door frames. Full prime and two coats of paint.',
  },
  'Door - Flat': {
    Basic: 'Light cleaning and two coats of paint to flat doors.',
    Standard: 'Clean and sand flat doors on both sides. Fill dents or imperfections. Apply two coats of paint.',
    Superior: 'Full preparation of flat doors including sanding both sides, filling, priming. Apply two coats of paint.',
    Restoration: 'Strip, repair, prime, and apply two coats of paint to flat doors.',
  },
  'Door - w/ Panels': {
    Basic: 'Light cleaning and two coats of paint to paneled doors.',
    Standard: 'Clean and sand paneled doors including panel recesses. Caulk panel edges where needed. Apply two coats of paint.',
    Superior: 'Full preparation of paneled doors including detail sanding of all panels and recesses, caulking, and priming. Apply two coats of paint.',
    Restoration: 'Strip, repair, and fully prime paneled doors. Apply two coats of paint with detail brushwork on panels.',
  },
  'Door - w/ Glass': {
    Basic: 'Light cleaning and two coats of paint to glass-paneled doors, cutting in around glass.',
    Standard: 'Clean and sand glass-paneled doors. Carefully cut in around glass panes. Apply two coats of paint.',
    Superior: 'Full preparation of glass-paneled doors including sanding, caulking around glass, and priming. Apply two coats of paint with precision cut-in.',
    Restoration: 'Strip and repair glass-paneled doors. Re-glaze as needed. Prime and apply two coats of paint.',
  },
  'Trim - Baseboard/Crown': {
    Basic: 'Light cleaning and two coats of paint to baseboard and crown molding.',
    Standard: 'Clean and lightly sand all baseboard and crown molding. Fill nail holes, caulk gaps at wall joints. Apply two coats of paint for a clean, finished look.',
    Superior: 'Full preparation of all baseboard and crown molding including sanding, filling, caulking all joints, and priming. Apply two coats of paint.',
    Restoration: 'Strip and restore all baseboard and crown molding. Repair or replace damaged sections. Full prime and two coats of paint.',
  },
  'Trim - Wainscotting': {
    Basic: 'Light cleaning and two coats of paint to wainscoting.',
    Standard: 'Clean and sand wainscoting panels and rails. Caulk joints and fill imperfections. Apply two coats of paint.',
    Superior: 'Full preparation of wainscoting including detail sanding, filling, caulking all joints, and priming. Apply two coats of paint.',
    Restoration: 'Strip and restore wainscoting. Repair damaged panels and rails. Full prime and two coats of paint.',
  },
  'Trim - Spindles/Balusters': {
    Basic: 'Light cleaning and two coats of paint to spindles and balusters.',
    Standard: 'Clean and sand all spindles and balusters. Apply two coats of paint with detail brushwork.',
    Superior: 'Full preparation of spindles and balusters including sanding, filling, and priming each spindle. Apply two coats of paint.',
    Restoration: 'Strip and restore all spindles and balusters. Repair or replace damaged pieces. Prime and apply two coats of paint.',
  },
  'Trim - Radiator': {
    Basic: 'Light cleaning and application of heat-resistant paint to radiator.',
    Standard: 'Clean, sand, and apply two coats of heat-resistant paint to radiator.',
    Superior: 'Full preparation of radiator including thorough sanding, rust treatment if needed, priming, and two coats of heat-resistant paint.',
    Restoration: 'Strip and restore radiator. Treat rust, apply specialized primer, and two coats of heat-resistant paint.',
  },
  'Trim - Handrail': {
    Basic: 'Light cleaning and two coats of paint to handrail.',
    Standard: 'Clean and sand handrail. Fill imperfections and apply two coats of paint.',
    Superior: 'Full preparation of handrail including sanding, filling, and priming. Apply two coats of paint.',
    Restoration: 'Strip and restore handrail. Repair damaged sections. Prime and apply two coats of paint.',
  },
  'Repair - Drywall Repair': {
    Basic: 'Patch visible holes and apply paint to repaired areas.',
    Standard: 'Patch holes and cracks with setting compound. Sand for a smooth, flush finish. Prime repaired areas and prepare the surface for painting.',
    Superior: 'Extensive drywall repair including patching all holes and cracks, skim coating for a smooth finish, and full priming of repaired areas.',
    Restoration: 'Full drywall remediation including large-scale patching, skim coating, and multi-coat priming system.',
  },
};

// ─── EXTERIOR WORK DESCRIPTION TEMPLATES ───────────────────────────

const EXTERIOR_DESCRIPTIONS: Record<string, DescriptionTemplate> = {
  siding: {
    Basic: 'Light cleaning and application of two coats of exterior paint.',
    Standard: 'Power wash all siding surfaces. Scrape and sand loose or peeling paint. Prime bare wood and repaired areas. Apply two coats of exterior acrylic latex.',
    Superior: 'Full preparation of siding including power washing, complete scraping and sanding, caulking of all joints and penetrations, and full primer coat. Apply two coats of exterior acrylic latex.',
    Restoration: 'Strip all failed coatings. Repair or replace damaged siding. Full caulking, priming, and two coats of exterior paint.',
  },
  doors: {
    Basic: 'Light cleaning and two coats of exterior paint to doors.',
    Standard: 'Clean, sand, and caulk exterior doors. Apply two coats of exterior paint.',
    Superior: 'Full preparation of exterior doors including sanding, filling, caulking, and priming. Apply two coats of exterior paint.',
    Restoration: 'Strip, repair, and fully prime exterior doors. Apply two coats of paint.',
  },
  windows: {
    Basic: 'Light cleaning and two coats of paint to exterior window frames.',
    Standard: 'Clean, sand, and caulk exterior window frames. Scrape loose paint. Apply two coats of exterior paint.',
    Superior: 'Full preparation of exterior windows including sanding, scraping, glazing repair, caulking, and priming. Apply two coats of paint.',
    Restoration: 'Strip and restore exterior windows. Re-glaze as needed. Full prime and two coats of paint.',
  },
  trim: {
    Basic: 'Light cleaning and two coats of paint to exterior trim.',
    Standard: 'Sand and prep all exterior trim surfaces. Caulk joints and gaps. Apply two coats of semi-gloss exterior paint.',
    Superior: 'Full preparation of all exterior trim including sanding, scraping, caulking all joints, and priming. Apply two coats of semi-gloss exterior paint.',
    Restoration: 'Strip and restore all exterior trim. Repair or replace damaged sections. Full prime and two coats of paint.',
  },
  carpentry_repairs: {
    Basic: 'Replace damaged materials and prepare for painting.',
    Standard: 'Remove and replace damaged materials. Prime new materials and blend into existing surfaces.',
    Superior: 'Remove and replace all damaged materials. Full preparation and priming of new and adjacent surfaces for a seamless finish.',
    Restoration: 'Extensive carpentry repair and replacement. Full integration with existing structure, priming, and finishing.',
  },
};

// ─── EPOXY WORK DESCRIPTION TEMPLATES ──────────────────────────────

const EPOXY_DESCRIPTIONS: Record<string, string> = {
  'Standard Epoxy': 'Prepare concrete surface and apply standard two-part epoxy coating system for a durable, chemical-resistant finish.',
  'Premium Epoxy': 'Prepare concrete surface and apply premium high-solids epoxy coating system for enhanced durability and chemical resistance.',
  'Polyurea': 'Prepare concrete surface and apply polyurea coating system. Fast-curing formula provides excellent impact and abrasion resistance.',
  'Polyaspartic': 'Prepare concrete surface and apply polyaspartic coating system. UV-stable formula suitable for areas with direct sunlight exposure.',
  existing_coating_removal: 'Remove existing coating using mechanical grinding to expose clean concrete substrate.',
  moisture_mitigation: 'Apply moisture mitigation system to address vapor transmission from concrete slab.',
  concrete_grinding: 'Diamond grind concrete surface to proper profile for coating adhesion.',
  crack_repair_minor: 'Route and fill minor cracks with flexible repair compound.',
  crack_repair_major: 'Route, fill, and reinforce major cracks with structural repair system.',
  flake_standard: 'Broadcast standard vinyl color flake into wet coating for a decorative, textured finish.',
  flake_full: 'Apply full-broadcast vinyl color flake for complete coverage and a seamless decorative finish.',
  flake_metallic: 'Apply metallic pigment flake for a premium, reflective decorative finish.',
  cove_base: 'Install integral cove base at wall-to-floor transitions for a seamless, cleanable perimeter.',
};

// ─── TEMPLATE ASSEMBLY FUNCTIONS ───────────────────────────────────

export interface EstimateSection {
  title: string;
  content: string;
}

export interface EstimateDocument {
  header: {
    company_name: string;
    phone: string;
    email: string;
    website: string;
    client_name: string;
    client_address: string;
    client_email: string;
    client_phone: string;
    date: string;
    reference: string;
    trade_label: string;
  };
  surface_grade: {
    selected: string;
    label: string;
    description: string;
    all_grades: { grade: string; label: string; selected: boolean }[];
  };
  work_description: { area: string; bullets: string[]; notes: string | null }[];
  prep_level: {
    selected: string;
    label: string;
    description: string;
    adjustment_label: string;
    all_levels: { level: string; label: string; selected: boolean; adjustment: string }[];
  };
  recap_table: {
    rows: { area: string; price: number; walls: string; ceilings: string; closets: string; doors: string; windows: string; trim: string; repairs: string }[];
    materials_total: number;
    grand_total: number;
  };
  payment_terms: {
    total: number;
    deposit_pct: number;
    deposit_amount: number;
    progress_pct: number | null;
    progress_amount: number | null;
    completion_pct: number;
    completion_amount: number;
  };
  production: {
    hours_low: number;
    hours_high: number;
    crew_size: number;
    days_low: number;
    days_high: number;
  };
}

export function assembleInteriorEstimate(
  scope: InteriorScopeData,
  quote: QuoteResult,
  tenant: { company_name: string; contact_phone: string; contact_email: string; website_url: string },
  submissionId: string,
): EstimateDocument {
  const prepLevel = scope.project.prep_level as keyof DescriptionTemplate;
  const tradeLabel = 'Interior Painting';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Work descriptions
  const workDesc = scope.rooms.map((room) => {
    const bullets: string[] = [];

    // Walls (always included)
    const wallDesc = INTERIOR_DESCRIPTIONS.walls[prepLevel];
    if (wallDesc) bullets.push(`Walls: ${wallDesc}`);

    // Ceiling
    if (room.ceiling_included) {
      const ceilDesc = INTERIOR_DESCRIPTIONS.ceiling[prepLevel];
      if (ceilDesc) bullets.push(`Ceiling: ${ceilDesc}`);
    }

    // Closet
    if (room.closet !== 'not_included') {
      const closetDesc = INTERIOR_DESCRIPTIONS.closet[prepLevel];
      if (closetDesc) bullets.push(`Closet (${room.closet}): ${closetDesc}`);
    }

    // Primer
    if (room.primer_required) {
      const primerDesc = INTERIOR_DESCRIPTIONS.primer[prepLevel];
      if (primerDesc) bullets.push(`Primer: ${primerDesc}`);
    }

    // Items (doors, windows, trim, repairs)
    for (const [itemName, qty] of Object.entries(room.items)) {
      if (qty <= 0) continue;
      const desc = INTERIOR_DESCRIPTIONS[itemName]?.[prepLevel];
      if (desc) {
        const qtyLabel = qty > 1 ? ` (${qty})` : '';
        bullets.push(`${itemName}${qtyLabel}: ${desc}`);
      }
    }

    return {
      area: `${room.room_type} (${room.room_size})`,
      bullets,
      notes: room.notes || null,
    };
  });

  // Recap table rows
  const recapRows = scope.rooms.map((room, i) => {
    const section = quote.sections[i];
    const doorCount = Object.entries(room.items).filter(([k, v]) => k.startsWith('Door') && v > 0).reduce((s, [, v]) => s + v, 0);
    const windowCount = Object.entries(room.items).filter(([k, v]) => k.startsWith('Window') && v > 0).reduce((s, [, v]) => s + v, 0);
    const trimCount = Object.entries(room.items).filter(([k, v]) => k.startsWith('Trim') && v > 0).reduce((s, [, v]) => s + v, 0);
    const repairCount = Object.entries(room.items).filter(([k, v]) => k.startsWith('Repair') && v > 0).reduce((s, [, v]) => s + v, 0);

    return {
      area: `${room.room_type} (${room.room_size})`,
      price: section?.sales_price || 0,
      walls: 'Included',
      ceilings: room.ceiling_included ? 'Included' : '—',
      closets: room.closet !== 'not_included' ? room.closet : '—',
      doors: doorCount > 0 ? `${doorCount}` : '—',
      windows: windowCount > 0 ? `${windowCount}` : '—',
      trim: trimCount > 0 ? `${trimCount}` : '—',
      repairs: repairCount > 0 ? `${repairCount}` : '—',
    };
  });

  // Payment terms
  const total = quote.grand_total;
  const needsProgress = total > 10000;
  const depositPct = 0.30;
  const progressPct = needsProgress ? 0.30 : null;
  const completionPct = needsProgress ? 0.40 : 0.70;

  // Production ranges (±20%)
  const hours = quote.production.painting_hours;
  const days = quote.production.duration_days;
  const hrsLow = Math.max(1, Math.round(hours * 0.80));
  const hrsHigh = Math.max(hrsLow + 1, Math.round(hours * 1.20));
  const dLow = Math.max(0.5, Math.round(days * 0.80 * 2) / 2);
  const dHigh = Math.max(dLow + 0.5, Math.round(days * 1.20 * 2) / 2);

  return {
    header: {
      company_name: tenant.company_name,
      phone: tenant.contact_phone,
      email: tenant.contact_email,
      website: tenant.website_url,
      client_name: scope.client.name,
      client_address: scope.client.address,
      client_email: scope.client.email,
      client_phone: scope.client.phone,
      date: dateStr,
      reference: submissionId.slice(0, 8).toUpperCase(),
      trade_label: tradeLabel,
    },
    surface_grade: {
      selected: scope.project.surface_grade,
      label: SURFACE_GRADE_DESCRIPTIONS[scope.project.surface_grade].label,
      description: SURFACE_GRADE_DESCRIPTIONS[scope.project.surface_grade].description,
      all_grades: Object.entries(SURFACE_GRADE_DESCRIPTIONS).map(([grade, info]) => ({
        grade,
        label: info.label,
        selected: grade === scope.project.surface_grade,
      })),
    },
    work_description: workDesc,
    prep_level: {
      selected: scope.project.prep_level,
      label: PREP_LEVEL_DESCRIPTIONS[scope.project.prep_level].label,
      description: PREP_LEVEL_DESCRIPTIONS[scope.project.prep_level].description,
      adjustment_label: PREP_LEVEL_DESCRIPTIONS[scope.project.prep_level].adjustment_label,
      all_levels: Object.entries(PREP_LEVEL_DESCRIPTIONS).map(([level, info]) => ({
        level,
        label: info.label,
        selected: level === scope.project.prep_level,
        adjustment: info.adjustment_label,
      })),
    },
    recap_table: {
      rows: recapRows,
      materials_total: quote.materials_total,
      grand_total: quote.grand_total,
    },
    payment_terms: {
      total,
      deposit_pct: depositPct,
      deposit_amount: Math.round(total * depositPct),
      progress_pct: progressPct,
      progress_amount: progressPct ? Math.round(total * progressPct) : null,
      completion_pct: completionPct,
      completion_amount: Math.round(total * completionPct),
    },
    production: {
      hours_low: hrsLow,
      hours_high: hrsHigh,
      crew_size: quote.production.crew_size,
      days_low: dLow,
      days_high: dHigh,
    },
  };
}

export function assembleExteriorEstimate(
  scope: ExteriorScopeData,
  quote: QuoteResult,
  tenant: { company_name: string; contact_phone: string; contact_email: string; website_url: string },
  submissionId: string,
): EstimateDocument {
  const prepLevel = scope.project.prep_level as keyof DescriptionTemplate;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const workDesc = scope.surfaces.map((surface) => {
    const bullets: string[] = [];

    const hasSiding = Object.values(surface.siding).some(v => v > 0);
    if (hasSiding) {
      const sidingTypes = Object.entries(surface.siding).filter(([, v]) => v > 0).map(([k, v]) => `${k} (${v})`).join(', ');
      bullets.push(`Siding — ${sidingTypes}: ${EXTERIOR_DESCRIPTIONS.siding[prepLevel]}`);
    }

    const hasDoors = Object.values(surface.doors).some(v => v > 0);
    if (hasDoors) {
      const doorCount = Object.values(surface.doors).reduce((s, v) => s + v, 0);
      bullets.push(`Doors (${doorCount}): ${EXTERIOR_DESCRIPTIONS.doors[prepLevel]}`);
    }

    const hasWindows = Object.values(surface.windows).some(v => v > 0);
    if (hasWindows) {
      const windowCount = Object.values(surface.windows).reduce((s, v) => s + v, 0);
      bullets.push(`Windows (${windowCount}): ${EXTERIOR_DESCRIPTIONS.windows[prepLevel]}`);
    }

    const hasTrim = Object.values(surface.trim).some(v => v > 0);
    if (hasTrim) {
      const trimItems = Object.entries(surface.trim).filter(([, v]) => v > 0).map(([k, v]) => `${k} (${v})`).join(', ');
      bullets.push(`Trim — ${trimItems}: ${EXTERIOR_DESCRIPTIONS.trim[prepLevel]}`);
    }

    const hasRepairs = Object.values(surface.carpentry_repairs).some(v => v > 0);
    if (hasRepairs) {
      const repairItems = Object.entries(surface.carpentry_repairs).filter(([, v]) => v > 0).map(([k, v]) => `${k} (${v})`).join(', ');
      bullets.push(`Carpentry Repairs — ${repairItems}: ${EXTERIOR_DESCRIPTIONS.carpentry_repairs[prepLevel]}`);
    }

    return { area: surface.name, bullets, notes: surface.notes || null };
  });

  const recapRows = scope.surfaces.map((surface, i) => {
    const section = quote.sections[i];
    const sidingCount = Object.values(surface.siding).reduce((s, v) => s + v, 0);
    const doorCount = Object.values(surface.doors).reduce((s, v) => s + v, 0);
    const windowCount = Object.values(surface.windows).reduce((s, v) => s + v, 0);
    const trimCount = Object.values(surface.trim).reduce((s, v) => s + v, 0);
    const repairCount = Object.values(surface.carpentry_repairs).reduce((s, v) => s + v, 0);

    return {
      area: surface.name,
      price: section?.sales_price || 0,
      walls: sidingCount > 0 ? `${sidingCount} sides` : '—',
      ceilings: '—',
      closets: '—',
      doors: doorCount > 0 ? `${doorCount}` : '—',
      windows: windowCount > 0 ? `${windowCount}` : '—',
      trim: trimCount > 0 ? `${trimCount}` : '—',
      repairs: repairCount > 0 ? `${repairCount}` : '—',
    };
  });

  const total = quote.grand_total;
  const needsProgress = total > 10000;
  const hours = quote.production.painting_hours;
  const days = quote.production.duration_days;

  return {
    header: {
      company_name: tenant.company_name,
      phone: tenant.contact_phone,
      email: tenant.contact_email,
      website: tenant.website_url,
      client_name: scope.client.name,
      client_address: scope.client.address,
      client_email: scope.client.email,
      client_phone: scope.client.phone,
      date: dateStr,
      reference: submissionId.slice(0, 8).toUpperCase(),
      trade_label: 'Exterior Painting',
    },
    surface_grade: {
      selected: scope.project.surface_grade,
      label: SURFACE_GRADE_DESCRIPTIONS[scope.project.surface_grade].label,
      description: SURFACE_GRADE_DESCRIPTIONS[scope.project.surface_grade].description,
      all_grades: Object.entries(SURFACE_GRADE_DESCRIPTIONS).map(([grade, info]) => ({
        grade, label: info.label, selected: grade === scope.project.surface_grade,
      })),
    },
    work_description: workDesc,
    prep_level: {
      selected: scope.project.prep_level,
      label: PREP_LEVEL_DESCRIPTIONS[scope.project.prep_level].label,
      description: PREP_LEVEL_DESCRIPTIONS[scope.project.prep_level].description,
      adjustment_label: PREP_LEVEL_DESCRIPTIONS[scope.project.prep_level].adjustment_label,
      all_levels: Object.entries(PREP_LEVEL_DESCRIPTIONS).map(([level, info]) => ({
        level, label: info.label, selected: level === scope.project.prep_level, adjustment: info.adjustment_label,
      })),
    },
    recap_table: { rows: recapRows, materials_total: quote.materials_total, grand_total: quote.grand_total },
    payment_terms: {
      total,
      deposit_pct: 0.30,
      deposit_amount: Math.round(total * 0.30),
      progress_pct: needsProgress ? 0.30 : null,
      progress_amount: needsProgress ? Math.round(total * 0.30) : null,
      completion_pct: needsProgress ? 0.40 : 0.70,
      completion_amount: Math.round(total * (needsProgress ? 0.40 : 0.70)),
    },
    production: {
      hours_low: Math.max(1, Math.round(hours * 0.80)),
      hours_high: Math.max(Math.round(hours * 0.80) + 1, Math.round(hours * 1.20)),
      crew_size: quote.production.crew_size,
      days_low: Math.max(0.5, Math.round(days * 0.80 * 2) / 2),
      days_high: Math.max(Math.round(days * 0.80 * 2) / 2 + 0.5, Math.round(days * 1.20 * 2) / 2),
    },
  };
}
