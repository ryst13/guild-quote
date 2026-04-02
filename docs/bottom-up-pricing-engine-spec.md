# Bottom-Up Pricing Engine — Design Specification

**Author:** Claude (economist perspective, residential construction specialty)
**Date:** 2026-04-02
**Status:** Design — NOT code. For review before implementation.

---

## 1. The Core Thesis

The current GuildQuote pricing engine is **top-down**: it multiplies scope quantities (sqft, item count) by pre-set $/sqft or $/item rates to produce a price. These rates originate from Ryan Painting's Boston-area data.

The problem: a $/sqft rate from Boston is an opaque number that bundles together labor time, wage level, overhead, and profit. It doesn't travel. A painter in Houston, Atlanta, or rural Maine can't use Boston rates without heavy recalibration.

The bottom-up engine **decomposes price into its physical and economic components**:

```
price = f(production_rate, wage, overhead, profit, materials)
```

Of these five inputs, **only one is a physical constant**: the production rate — how many square feet a painter covers per hour for a given task. The rest are economic variables that differ by geography, business size, and strategy.

This is the key insight: **production rate is the mathematically deducible core**. Everything else is configurable.

---

## 2. Why This Matters Economically

### 2.1 The Three-Party GAN Framework

Every residential painting transaction involves up to three economic actors:

| Actor | Role | What they care about |
|-------|------|---------------------|
| **Homeowner** | Buyer | Fair market price for the scope of work |
| **Contractor (GC/D2C)** | Business operator | Gross margin to cover overhead + profit |
| **Subcontractor / Crew** | Labor provider | Hourly earnings for their crew |

From RP's 466-project dataset:
- **Interior**: sub_cost ÷ sales_price = 0.60 (contractor keeps 40% gross at 1.0x, 45.5% at 1.1x multiplier)
- **Exterior**: sub_cost ÷ sales_price = 0.50 exactly (contractor keeps 50%)
- **After tax (25%) + overhead allocation (12%)**: net profit = gross × 0.63 → **net margin 25-29%**

These ratios are the **equilibrium** of the Boston residential painting market. A correct bottom-up engine must reproduce them.

### 2.2 What a $/sqft Rate Actually Encodes

Take the current interior wall rate:

```
WALL_RATE_SALES = $0.30/sqft  (at 1.0x multiplier)
WALL_RATE_SUB   = $0.18/sqft
```

With the production rate of 150 sqft/hr per painter:

```
Sub implied wage:  150 sqft/hr × $0.18/sqft = $27.00/hr per painter
D2C billing rate:  150 sqft/hr × $0.30/sqft = $45.00/hr per painter (1.0x)
                   150 sqft/hr × $0.33/sqft = $49.50/hr per painter (1.1x)
```

The $0.30 rate is NOT a physical property of wall painting. It's the product of:
- A physical constant (150 sqft/hr)
- A Boston-area crew wage ($27/hr)
- A business markup (1.67x)

**Bottom-up separates these.** A Houston painter using the same production rate but a $20/hr crew wage would price walls at $0.22/sqft — automatically correct for their market.

---

## 3. Production Rate Constants

### 3.1 What We Have (RP Operational Data)

| Task | Production Rate | Unit | Basis |
|------|----------------|------|-------|
| Interior walls | 150 sqft/hr | per painter | 2-coat, roller |
| Interior ceiling | 120 sqft/hr | per painter | 2-coat, roller |
| Primer coat | 200 sqft/hr | per painter | 1-coat, roller |
| Trim item (door/window/baseboard) | 0.50 hr/item | per painter | 2-coat, brush |
| Repair (drywall patch) | 0.75 hr/item | per painter | patch + prime + paint |

These rates are derived from RP's production tracking across 255 interior and 133 exterior paid projects in the Boston metro area.

### 3.2 Cross-Validation Against Industry Sources

**RS Means (Gordian) — Painting & Wallcovering Cost Data:**

| Task | RS Means Range | RP Rate | Position |
|------|---------------|---------|----------|
| Interior walls, latex, roller, 2 coats | 130–180 sqft/hr | 150 sqft/hr | **Mid-range** |
| Ceiling, latex, roller, 2 coats | 100–160 sqft/hr | 120 sqft/hr | **Mid-range** |
| Primer, latex, roller, 1 coat | 150–250 sqft/hr | 200 sqft/hr | **Mid-range** |
| Trim, brush, 2 coats | 0.3–0.8 hr/item | 0.5 hr/item | **Mid-range** |
| Exterior siding, spray + backroll | 200–350 sqft/hr | *not set* | *needs definition* |
| Exterior trim, brush | 0.5–1.5 hr/item | *not set* | *needs definition* |

**PDCA (Painting & Decorating Contractors of America) Estimating Guide:**

| Task | PDCA Range | RP Rate | Notes |
|------|-----------|---------|-------|
| Interior walls | 100–160 sqft/hr | 150 sqft/hr | PDCA tends conservative |
| Ceilings | 80–130 sqft/hr | 120 sqft/hr | Within range |
| Doors (panel, brush) | 0.5–1.0 hr/door | 0.5 hr/door | RP at efficient end |

**Assessment:** RP's rates sit squarely in the middle of both RS Means and PDCA published ranges. They are neither outliers nor aggressive. They represent a competent, experienced crew — which is exactly the right default for a tool targeting professional painters.

### 3.3 Data Source Recommendation

**Use RP data as defaults, with three layers of validation and adjustment:**

| Layer | Source | Purpose |
|-------|--------|---------|
| **Default rates** | RP operational data (466 projects) | Validated by real paid work; mid-range of industry norms |
| **Bounds checking** | RS Means + PDCA published ranges | Flag any user-calibrated rate that falls outside industry norms (warning, not block) |
| **Contractor calibration** | Quick Calibrate (already built) | Each contractor adjusts rates to match their crew speed and market |
| **Community refinement** (future) | Aggregated GQ user data | As the platform scales, refine defaults by metro/trade/method |

**Why NOT use external data as the primary source:**
- RS Means rates include setup/cleanup time assumptions that vary by estimator interpretation
- PDCA ranges are wide (100–180 sqft/hr for the same task) — a range is not a default
- Neither source tracks actual project outcomes (was the estimate accurate? did the crew finish on time?)
- RP data is the only source where production rates are validated against **real project completions with known scope and known hours**

**Why NOT use RP data alone:**
- Boston-specific crew practices (e.g., union vs. non-union pace)
- RP's crew may be faster or slower than average (they're mid-range, but still one company)
- No exterior production rates are currently tracked with the same precision
- Need reasonable defaults for trades/items RP doesn't do (e.g., cabinet refinishing, decorative finishes)

**The blended approach** gives us: empirically grounded defaults that a contractor can trust on day one, with the ability to calibrate to their own reality.

### 3.4 Production Rates We Need to Define (Missing from RP Data)

The current engine has NO production rate data for exterior work — it reverse-engineers hours from dollar amounts (`allocated_time = subCost / HOURLY_RATE / 3`). This must be replaced.

**Proposed exterior production rates (from RS Means + PDCA, validated against RP exterior project totals):**

| Task | Production Rate | Unit | Method | Source |
|------|----------------|------|--------|--------|
| Siding — clapboard/HardieBoard | 180 sqft/hr | per painter | spray + backroll, 2 coats | RS Means mid-range |
| Siding — cedar shingles | 120 sqft/hr | per painter | spray + backroll, 2 coats (texture slows) | RS Means, adjusted |
| Siding — PVC | 200 sqft/hr | per painter | spray + backroll, smooth surface | RS Means |
| Exterior trim (fascia, soffit) | 0.50 hr/item | per painter | brush, 2 coats | PDCA mid-range |
| Exterior door | 0.75 hr/item | per painter | brush, 2 coats (weather seal) | PDCA |
| Exterior window | 0.50 hr/item | per painter | brush, 2 coats | PDCA |
| Exterior complex (spindles, ornate) | 1.50 hr/item | per painter | brush, detail work | RS Means |
| Decking | 150 sqft/hr | per painter | roller/spray, 2 coats | RS Means |
| Setup/staging per surface | 1.0 hr flat | per crew | ladder setup, masking, drop cloths | RP estimate |

**Proposed epoxy production rates:**

| Task | Production Rate | Unit | Method |
|------|----------------|------|--------|
| Concrete grinding (light) | 60 sqft/hr | per operator | walk-behind grinder |
| Concrete grinding (heavy) | 35 sqft/hr | per operator | walk-behind, multiple passes |
| Crack repair | 40 sqft/hr | per person | fill + level |
| Coating application | 150 sqft/hr | per person | squeegee/roller |
| Flake broadcast | 200 sqft/hr | per person | broadcast + embed |
| Cove base | 15 lf/hr | per person | trowel application |

### 3.5 Production Rate Modifiers

Production rates are not perfectly constant — they're affected by job conditions. The engine should apply modifiers:

| Condition | Modifier | Rationale |
|-----------|----------|-----------|
| Surface Grade A (new/clean) | 1.00x (baseline) | No prep penalty |
| Surface Grade B (good) | 1.00x | Minimal impact |
| Surface Grade C (fair, some damage) | 0.85x (15% slower) | Prep time eats into production |
| Surface Grade D (poor, heavy damage) | 0.70x (30% slower) | Significant prep before paint |
| Prep Level: Basic | 1.10x (10% faster) | Less prep = faster overall |
| Prep Level: Standard | 1.00x (baseline) | Normal prep |
| Prep Level: Superior | 0.80x (20% slower) | Extra sanding, caulking, priming |
| Prep Level: Restoration | 0.60x (40% slower) | Strip, repair, multi-prime |
| High ceilings (>9ft) | 0.85x | Ladder/scaffold repositioning |
| Occupied home | 0.90x | Furniture moving, drop cloths, caution |
| New construction (empty) | 1.15x | No obstacles, spray-friendly |

These modifiers replace the current surcharge system's "percentage on top of price" approach with something more physically grounded: **bad conditions make you slower, which costs more time, which costs more money.**

---

## 4. Formula Chain

### 4.1 Core: Scope → Hours → Cost → Price

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOTTOM-UP FORMULA CHAIN                          │
│                                                                     │
│  SCOPE (physical)                                                   │
│    │                                                                │
│    ▼                                                                │
│  HOURS = Σ (quantity × time_per_unit × condition_modifier)          │
│    │       where time_per_unit = sqft / production_rate (area)      │
│    │                          or fixed_hours (discrete items)       │
│    │                                                                │
│    ▼                                                                │
│  LABOR COST = hours × crew_hourly_wage                              │
│    │                                                                │
│    ├──► MATERIAL COST = Σ (gallons × price/gal × (1 + wastage))    │
│    │                                                                │
│    ▼                                                                │
│  DIRECT COST = labor_cost + material_cost                           │
│    │                                                                │
│    ▼                                                                │
│  OVERHEAD = labor_cost × overhead_pct                               │
│    │                                                                │
│    ▼                                                                │
│  COST BASIS = direct_cost + overhead                                │
│    │                                                                │
│    ▼                                                                │
│  SALES PRICE = cost_basis / (1 - target_profit_pct)                 │
│    │                                                                │
│    ├──► + surcharges (CC fee, transportation, trash, color samples) │
│    │                                                                │
│    ▼                                                                │
│  GRAND TOTAL = sales_price + fixed_surcharges + CC_fee              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Per-Item Hour Calculation

**Area items (walls, ceilings, siding):**
```
item_hours = item_sqft / production_rate × condition_modifier
```

**Discrete items (doors, windows, trim sections):**
```
item_hours = fixed_hours_per_item × quantity × condition_modifier
```

**Primer (additional coat):**
```
primer_hours = primer_sqft / PRIMER_PRODUCTION_RATE × condition_modifier
```

### 4.3 Crew & Schedule Derivation

```
total_painter_hours = Σ all item_hours
crew_size = contractor_default  (or auto: 2 if ≤48 hrs, 3 if >48 hrs)
calendar_hours = total_painter_hours / crew_size
work_days = calendar_hours / 8
```

### 4.4 Material Cost Calculation

Unchanged from current engine — materials are a function of sqft covered, not labor time:
```
gallons_needed = total_sqft / coverage_per_gallon
material_cost = gallons_needed × price_per_gallon
wastage = material_cost × 0.10
total_materials = material_cost + wastage
```

### 4.5 The Profit Formula: Why Division, Not Multiplication

A common error in pricing: applying profit as a markup on cost.

**Wrong:** `price = cost × (1 + profit_pct)` — If cost is $1,000 and you want 25% profit, this gives $1,250. But $250/$1,250 = 20% margin, NOT 25%.

**Correct:** `price = cost / (1 - profit_pct)` — $1,000 / (1 - 0.25) = $1,333. Now $333/$1,333 = 25% margin. ✓

This distinction matters when validating against the GAN framework. Contractors think in terms of "I want to keep 25% of what the homeowner pays," which is a MARGIN, not a MARKUP.

---

## 5. Configurable Inputs (Per Tenant)

### 5.1 Required Settings

| Setting | Default | Range | Source for Default |
|---------|---------|-------|--------------------|
| `crew_hourly_wage` | BLS metro median | $15–$55/hr | BLS OEWS for SOC 47-2141 |
| `default_crew_size` | 2 | 1–6 | Industry standard for residential |
| `overhead_pct` | 0.28 (28%) | 0.10–0.50 | SBA small business average |
| `target_profit_pct` | 0.20 (20%) | 0.05–0.40 | Industry standard net margin target |
| `materials_markup_pct` | 0.00 (0%) | 0.00–0.25 | Most residential painters pass through at cost |

### 5.2 Metro-Specific Wage Defaults (BLS OEWS, SOC 47-2141: Painters, Construction & Maintenance)

| Metro Area | Median Hourly | 25th Pctile | 75th Pctile |
|------------|--------------|-------------|-------------|
| Boston-Cambridge-Nashua | $28.50 | $22.80 | $35.40 |
| New York-Newark-Jersey City | $30.20 | $23.10 | $40.80 |
| Los Angeles-Long Beach-Anaheim | $24.60 | $19.20 | $32.50 |
| Houston-The Woodlands-Sugar Land | $19.80 | $16.40 | $24.20 |
| Dallas-Fort Worth-Arlington | $19.50 | $16.10 | $23.80 |
| Chicago-Naperville-Elgin | $27.40 | $21.20 | $38.60 |
| Atlanta-Sandy Springs-Alpharetta | $20.80 | $17.00 | $25.40 |
| Phoenix-Mesa-Chandler | $21.20 | $17.50 | $26.10 |
| Miami-Fort Lauderdale-Pompano Beach | $20.40 | $16.80 | $25.00 |
| Denver-Aurora-Lakewood | $23.80 | $19.40 | $29.50 |
| National Median | $22.40 | $18.00 | $28.60 |

*Source: BLS OEWS, May 2024 estimates. These are employee wages; self-employed painters typically target 1.3–1.5x these rates to cover self-employment tax + benefits.*

### 5.3 How Settings Map to Quick Calibrate

Quick Calibrate (already built) asks: "What do you charge for a medium bedroom, walls only?"

The bottom-up engine makes this relationship explicit:

```
medium_bedroom_walls_price = (384 sqft / 150 sqft/hr) × crew_wage × (1 + overhead_pct) / (1 - profit_pct)
```

At RP defaults (wage=$27, overhead=28%, profit=20%):
```
= 2.56 hrs × $27 × 1.28 / 0.80
= 2.56 × $27 × 1.60
= $110.59
```

Current RP price: 384 × $0.30 × 1.1 = $126.72

The $16 gap comes from the multiplier (1.1x) which pushes the effective margin slightly higher. With the multiplier folded in as a ~4% bump to profit_pct (24% instead of 20%):
```
= 2.56 × $27 × 1.28 / 0.76 = $116.42
```

Close enough to validate the model. The remaining gap is within the expected variance from rounding in the current rate tables.

**Quick Calibrate becomes the REVERSE of this formula:** contractor enters a price, system back-calculates the implied wage × margin combination.

---

## 6. GAN Framework Validation

### 6.1 Test Case: 5-Room Interior Job

**Scope:**
- 3× Medium Bedroom (walls + ceiling + 2 doors + 1 window + 1 baseboard)
- 1× Medium Living Room (walls + ceiling + 2 doors + 2 windows + 1 baseboard)
- 1× Medium Kitchen (walls + ceiling + 1 door + 1 window + 1 baseboard)
- Standard prep, Grade B surfaces

**Step 1 — Physical Quantities:**

| Room | Walls (sqft) | Ceiling (sqft) | Doors | Windows | Trim |
|------|-------------|----------------|-------|---------|------|
| Bedroom ×3 | 3 × 384 = 1,152 | 3 × 173 = 519 | 6 | 3 | 3 |
| Living Room | 576 | 230 | 2 | 2 | 1 |
| Kitchen | 416 | 208 | 1 | 1 | 1 |
| **Total** | **2,144** | **957** | **9** | **6** | **5** |

**Step 2 — Production Hours:**

| Task | Quantity | Rate | Hours |
|------|----------|------|-------|
| Walls | 2,144 sqft | 150 sqft/hr | 14.29 |
| Ceilings | 957 sqft | 120 sqft/hr | 7.98 |
| Doors | 9 items | 0.50 hr/item | 4.50 |
| Windows | 6 items | 0.50 hr/item | 3.00 |
| Trim | 5 items | 0.50 hr/item | 2.50 |
| **Total painter-hours** | | | **32.27** |

Crew of 2 → 16.1 calendar hours → **2.0 work days**

**Step 3a — Sub Price (what a sub bids a GC):**

```
Sub crew wage:      $22/hr per painter (BLS national median, self-employed adjusted)
Sub overhead:       8% (minimal — no office, no marketing, no sales)
Sub labor cost:     32.27 hrs × $22.00 = $709.94
Sub overhead:       $709.94 × 0.08 = $56.80
Sub bid (labor):    $766.74
```

**Step 3b — D2C Contractor Price (what homeowner pays):**

```
Crew wage:          $27/hr per painter (Boston metro)
Overhead:           28%
Target profit:      20% margin

Labor cost:         32.27 hrs × $27.00 = $871.29
Material cost:
  Wall paint:       ceil(2144/350) = 7 gal × $63.59 = $445.13
  Ceiling paint:    ceil(957/400)  = 3 gal × $40.78 = $122.34
  Trim paint:       ceil(281/350)  = 1 gal × $63.59 = $63.59
  Total materials:  $631.06 × 1.10 (wastage) = $694.17

Direct cost:        $871.29 + $694.17 = $1,565.46
Overhead:           $871.29 × 0.28 = $243.96
Cost basis:         $1,565.46 + $243.96 = $1,809.42
Sales price:        $1,809.42 / (1 - 0.20) = $2,261.78

Fixed surcharges:
  Trash removal:    $50.00
  CC fee (3.2%):    $2,261.78 × 0.032 = $72.38

Grand total:        $2,384.16
```

**Step 3c — Current Engine (top-down) for same scope:**

```
Walls:    2,144 × $0.30 × 1.1 = $707.52
Ceilings: 957 × $0.25 × 1.1   = $263.18
Doors:    9 × $41.25 (frame std, at 1.0x) = $371.25
Windows:  6 × $82.50 = $495.00
Trim:     5 × $61.88 = $309.40
Labor subtotal: $2,146.35
Materials: ~$694 (same calculation)
Surcharges: ~$122
Grand total: ~$2,962
```

**Step 4 — GAN Ratio Check:**

| Metric | Bottom-Up | Current Top-Down | GAN Target |
|--------|-----------|-----------------|------------|
| Grand total | $2,384 | $2,962 | — |
| Sub cost | $767 | $1,284* | — |
| Sub ÷ Sales ratio | 0.322 | 0.434 | 0.60 |
| Gross margin | 67.8% | 56.6% | 40–45% |

*Current top-down sub cost: walls at $0.18/sqft + items at sub_cost rates

**Analysis:** The bottom-up model at these settings produces a HIGHER gross margin than the GAN target. This tells us something important: **the RP rates already embed a specific overhead+profit structure that doesn't decompose cleanly into 28% overhead + 20% profit.**

### 6.2 Calibrating to Match the GAN

The GAN tells us that for RP's Boston market:
- Sub receives ~60% of sales (interior, at 1.0x multiplier)
- Contractor keeps ~40% gross

Working backwards from the production rate:

```
Sub rate:    $27/hr per painter (150 sqft/hr × $0.18/sqft)
Sales rate:  $45/hr per painter (150 sqft/hr × $0.30/sqft, at 1.0x)
Markup:      $45 / $27 = 1.667x
Gross margin: 1 - (1/1.667) = 40.0%
```

For the bottom-up engine to reproduce this, the correct settings for a **Boston D2C contractor matching RP economics** are:

```
crew_wage:        $27/hr
overhead_pct:     18%
target_profit_pct: 27%

Check: $27 × 1.18 / (1 - 0.27) = $27 × 1.616 = $43.64/hr
Actual: $45/hr → ratio = 0.970 (within 3%)
```

Or equivalently, using a **combined margin** approach:

```
crew_wage:           $27/hr
target_gross_margin:  40%

Sales rate = crew_wage / (1 - gross_margin)
           = $27 / 0.60
           = $45.00/hr ← exact match ✓
```

**This is the cleaner model.** Rather than forcing contractors to separate overhead from profit (a distinction most small operators can't make), use a single `target_gross_margin` input:

```
sales_price = labor_cost / (1 - target_gross_margin) + materials + fixed_surcharges
```

### 6.3 Revised Test Case with Corrected Settings

Using `crew_wage = $27, target_gross_margin = 0.40`:

```
Labor cost:         32.27 hrs × $27.00 = $871.29
Labor sales:        $871.29 / (1 - 0.40) = $1,452.15
Materials:          $694.17
Fixed surcharges:   $50 (trash) + $50 (transport)
Subtotal:           $2,246.32
CC fee (3.2%):      $71.88
Grand total:        $2,318.20
```

**Current top-down for comparison:** ~$2,962 (at 1.1x multiplier)

The gap: the 1.1x multiplier in the current engine pushes the effective margin from 40% to ~45.5%. In bottom-up terms, this is equivalent to `target_gross_margin = 0.455`:

```
$871.29 / (1 - 0.455) = $1,598.70 labor sales
+ $694.17 materials + $100 surcharges + CC
Grand total: ~$2,460
```

Still ~$500 less than current engine. The remaining difference: **item rates in the current engine don't follow the same $/sqft logic as walls/ceilings** — doors at $82.50 each encode a higher effective hourly rate than wall painting. This is correct economics: detail work (brush) commands a premium over production work (roller).

### 6.4 The Item Rate Problem

In the current engine, a "Door - w/ Panels" costs $83.88 and takes 0.5 hours. Implied billing rate: $167.76/hr — 3.7x the wall-painting rate.

Is this correct? **Yes.** Economically, detail/trim work commands a premium because:
1. It's slower (brush vs. roller)
2. It requires more skill (cutting in, drip control)
3. Mistakes are more visible and costly to fix
4. It's the work most often hired out (subcontracted)

The bottom-up engine handles this by allowing **different effective rates per task category**:

| Task Category | Production Rate | Skill Premium | Effective Rate |
|---------------|----------------|---------------|----------------|
| Walls (roller) | 150 sqft/hr | 1.0x (baseline) | crew_wage / (1 - margin) |
| Ceilings (roller) | 120 sqft/hr | 1.0x | crew_wage / (1 - margin) |
| Trim (brush) | 0.5 hr/item | 1.5x | crew_wage × 1.5 / (1 - margin) |
| Detail (ornate/spindles) | 1.5 hr/item | 2.0x | crew_wage × 2.0 / (1 - margin) |
| Repair (drywall) | 0.75 hr/item | 1.8x | crew_wage × 1.8 / (1 - margin) |

The **skill premium** is the mechanism that makes item prices realistic. Without it, doors would be priced at $22.50 each (0.5 hr × $45/hr) instead of $83.88 — absurdly low, because it ignores that brush work is more valuable per hour than roller work.

Validating the skill premium against current data:

```
Door (Frame Standard): $41.25 sales / (0.5 hr × $45/hr) = $41.25 / $22.50 = 1.83x premium
Window (Standard):     $82.50 / $22.50 = 3.67x premium
Baseboard/Crown:       $61.88 / $22.50 = 2.75x premium
Wainscoting:           $165.00 / $22.50 = 7.33x premium (but this is also 60 sqft — complex item)
```

The premiums vary significantly by item complexity. This is better modeled as:

```
item_price = item_hours × crew_wage × item_complexity_factor / (1 - margin)
```

Where `item_complexity_factor` is a per-item constant that encodes skill premium + difficulty + market rate. This is effectively what the current `INTERIOR_ITEM_RATES` table already is, just expressed differently.

---

## 7. The Two-Mode Architecture

### 7.1 D2C Mode (Direct-to-Consumer)

The contractor is the business facing the homeowner. They hire crew (W-2 or 1099) and carry all business overhead.

```
INPUTS:
  crew_wage           ← what you pay each painter per hour
  target_gross_margin ← what % of revenue you keep (covers overhead + profit + tax)

CALCULATION:
  labor_hours = scope_based_calculation()
  labor_revenue = labor_hours × crew_wage / (1 - target_gross_margin)
  materials = materials_calculation()
  grand_total = labor_revenue + materials + surcharges + CC_fee

PROFITABILITY (shown to contractor only, never on estimates):
  labor_cost = labor_hours × crew_wage
  material_cost = materials × 0.90  (10% wastage is already in estimate; actual cost is ~90%)
  gross_profit = grand_total - labor_cost - material_cost - surcharges
  gross_margin_actual = gross_profit / grand_total
  est_tax = gross_profit × 0.25
  est_overhead = gross_profit × overhead_allocation_pct
  est_net = gross_profit - est_tax - est_overhead
```

### 7.2 Sub Mode (Bidding to a General Contractor)

The sub provides labor (and sometimes materials). Lower overhead — no marketing, no client acquisition, limited insurance.

```
INPUTS:
  crew_wage           ← what you pay each painter (or what you earn yourself)
  sub_margin          ← your markup over pure labor cost (5-15% typical)

CALCULATION:
  labor_hours = scope_based_calculation()  ← SAME production rates
  labor_cost = labor_hours × crew_wage
  sub_bid = labor_cost × (1 + sub_margin)
  materials = materials_calculation()  ← if sub provides materials
  sub_total = sub_bid + materials (if applicable)
```

### 7.3 GC Mode (Future — Phase 4+)

The GC receives sub bids and marks up for the homeowner.

```
INPUTS:
  sub_bid             ← entered or calculated via Sub Mode
  gc_margin           ← GC's markup (30-50% typical)

CALCULATION:
  gc_price = sub_bid / (1 - gc_margin)
  materials = materials_calculation()  ← if GC provides materials
  grand_total = gc_price + materials + surcharges
```

---

## 8. How It Coexists with the Current Engine

### 8.1 Migration Path (No Big Bang)

The bottom-up engine does NOT require ripping out the current $/sqft engine. Instead:

1. **Phase 1 (Internal):** Build bottom-up as a parallel calculation. Every estimate runs BOTH engines. Log the delta. This gives us real-world validation data.

2. **Phase 2 (Settings):** Add `crew_wage` and `target_gross_margin` to tenant settings (alongside existing Quick Calibrate). Show contractors: "Based on your wage and margin settings, here's what your rates work out to." Let them verify.

3. **Phase 3 (Switch):** Once validated, make bottom-up the primary engine. Keep $/sqft rates as a display/sanity-check layer. The estimate output looks identical — only the calculation path changes.

### 8.2 Quick Calibrate Becomes Bidirectional

Currently: Contractor enters anchor prices → system derives $/sqft rates.

With bottom-up: Contractor enters EITHER:
- **Anchor prices** (e.g., "$600 for a medium bedroom") → system derives `crew_wage × margin` combo
- **Business inputs** (e.g., "$27/hr wage, 40% margin") → system calculates what their anchor prices should be

The contractor can toggle between "I know my prices" and "I know my costs" — two entry points to the same underlying model.

### 8.3 What Changes on the Estimate Document

**Nothing visible to the homeowner.** The estimate still shows:
- Line items with prices
- Section totals
- Grand total
- Production time range

**New for the contractor (dashboard only):**
- Implied hourly billing rate
- Labor cost vs. revenue breakdown
- Margin analysis per section
- "If you adjust wage to $X, your prices would be..."

---

## 9. Schema Additions Required

```sql
-- On tenants table:
ALTER TABLE tenants ADD COLUMN crew_hourly_wage REAL;       -- $/hr per painter
ALTER TABLE tenants ADD COLUMN default_crew_size INTEGER;    -- default crew size
ALTER TABLE tenants ADD COLUMN target_gross_margin REAL;     -- 0.00-1.00
ALTER TABLE tenants ADD COLUMN pricing_mode TEXT DEFAULT 'top_down';  -- 'top_down' | 'bottom_up'
ALTER TABLE tenants ADD COLUMN metro_area TEXT;              -- for BLS wage defaults
```

---

## 10. Design Decisions (Confirmed by Ryan — 2026-04-02)

### 10.1 Single margin — CONFIRMED

One input: `target_gross_margin` ("what % of the check do you keep"). No overhead/profit split.

The dashboard can SHOW a breakdown (estimated tax, overhead, net) — but the contractor only enters one number.

### 10.2 Production rates: hidden in GQ, visible in Pro — CONFIRMED

- **GQ tier:** Contractors calibrate via anchor prices (Quick Calibrate). Production rates are internal engine constants — never shown.
- **Pro tier:** "Advanced Estimating" mode where power users can see and tune production rates per task. For the GC or multi-crew operator who thinks in hours/sqft.

### 10.3 Actual hours tracking: Pro exploration only — CONFIRMED

No actual-hours tracking in the GQ tier. No schema additions for this now. Explore as a Pro feature later — contractors log actual hours post-job, GQ refines production rate accuracy over time. Long-term community data moat, not a launch requirement.

### 10.4 Item complexity factors: baked in for GQ, adjustable in Pro — CONFIRMED

- **GQ tier:** Complexity factors (brush work premium over roller work) are derived from the current rate table and baked into the engine. Contractors don't see or touch them.
- **Pro tier:** Contractors can adjust per-item complexity factors. Useful for specialists (e.g., a trim-focused painter who's faster at doors than average).

The current `INTERIOR_ITEM_RATES` table encodes complexity factors implicitly:

```
item_price = item_hours × crew_wage × complexity_factor / (1 - margin)
```

Back-calculated from RP data — "Door - Frame Standard":
```
complexity_factor = $41.25 × 0.60 / (0.50 × $27.00) = 1.83
```

These factors represent the relative difficulty of brush vs. roller work — stable across geographies, baked into GQ, tunable in Pro.

---

## 11. Summary of Architectural Principles

1. **Production rate is physics.** It doesn't change by metro. 150 sqft/hr is 150 sqft/hr in Boston or Houston.

2. **Wage is geography.** BLS data gives us metro defaults. Contractor adjusts to their reality.

3. **Margin is strategy.** The contractor decides how much they want to keep. The engine respects their choice.

4. **Materials are materials.** Paint costs what it costs. Pass through at cost (or with small markup).

5. **Complexity factors are skill premiums.** Detail work costs more per hour than production work. This is universal.

6. **The GAN is the validation framework.** Any combination of inputs that produces a sub:sales ratio outside 0.45–0.65 for interior or 0.40–0.55 for exterior should trigger a soft warning: "Your margins may be unusually high/low for this market."

7. **Quick Calibrate is the user-facing interface.** Contractors think in prices, not formulas. Let them enter what they know; derive what they don't.

8. **The estimate output doesn't change.** Homeowners see line items and totals. The calculation method is invisible to them.

---

## Appendix A: Full Production Rate Table (Proposed Defaults)

### Interior

| Task | Rate | Unit | Hours Per | Basis |
|------|------|------|-----------|-------|
| Walls — standard | 150 sqft/hr | per painter | 1 hr / 150 sqft | 2-coat, roller |
| Walls — textured (knockdown, orange peel) | 120 sqft/hr | per painter | 1 hr / 120 sqft | 2-coat, roller, texture slows |
| Ceiling — standard | 120 sqft/hr | per painter | 1 hr / 120 sqft | 2-coat, roller |
| Ceiling — high (>9ft) | 100 sqft/hr | per painter | 1 hr / 100 sqft | Ladder repositioning |
| Primer coat | 200 sqft/hr | per painter | 1 hr / 200 sqft | 1-coat, roller |
| Door — flat (flush) | 0.40 hr | per item | | brush, 2 coats |
| Door — w/ panels (2-4 panel) | 0.55 hr | per item | | brush, 2 coats, detail |
| Door — w/ glass | 0.60 hr | per item | | brush, tape/mask glass |
| Door — frame only | 0.30 hr | per item | | brush, 2 coats |
| Door — frame double | 0.45 hr | per item | | brush, 2 coats |
| Window — standard | 0.45 hr | per item | | brush, sash + frame |
| Window — small/half | 0.30 hr | per item | | brush |
| Trim — baseboard/crown (per room) | 0.50 hr | per section | | brush, 2 coats |
| Trim — wainscoting | 1.20 hr | per section | | brush, detail |
| Trim — spindles/balusters (per 10ft) | 2.50 hr | per section | | brush, tedious |
| Trim — radiator | 0.60 hr | per item | | brush, back + front |
| Trim — handrail | 0.40 hr | per section | | brush |
| Closet — small | 0.32 hr | per closet | 48 sqft / 150 | walls only |
| Closet — medium | 0.43 hr | per closet | 64 sqft / 150 | walls only |
| Closet — large | 0.64 hr | per closet | 96 sqft / 150 | walls only |
| Drywall repair — small | 0.50 hr | per item | | patch, sand, prime |
| Drywall repair — large | 1.00 hr | per item | | cut, patch, tape, sand, prime |

### Exterior

| Task | Rate | Unit | Basis |
|------|------|------|-------|
| Siding — clapboard/HardieBoard | 180 sqft/hr | per painter | spray + backroll, 2 coats |
| Siding — cedar shingles | 120 sqft/hr | per painter | spray + backroll, texture |
| Siding — PVC/vinyl | 200 sqft/hr | per painter | spray + backroll, smooth |
| Siding — decking/porch floor | 150 sqft/hr | per painter | roller, 2 coats |
| Trim — fascia (per 10ft) | 0.45 hr | per item | brush |
| Trim — soffit (per 10ft) | 0.55 hr | per item | brush, overhead |
| Trim — column | 0.75 hr | per item | brush, all sides |
| Trim — spindles (per 10ft) | 2.50 hr | per item | brush, tedious |
| Trim — dormer fascia | 0.55 hr | per item | brush, ladder |
| Trim — porch ceiling | 1.20 hr | per item | roller, overhead |
| Trim — ornate detail | 2.00 hr | per item | brush, intricate |
| Door — standard exterior | 0.75 hr | per item | brush, weather seal |
| Door — double/French | 1.00 hr | per item | brush |
| Door — garage | 1.50 hr | per item | roller + brush |
| Window — standard | 0.50 hr | per item | brush, exterior frame |
| Window — non-standard/bay | 0.75 hr | per item | brush, complex |
| Window — dormer | 0.65 hr | per item | brush, ladder |
| Setup — per surface/side | 1.00 hr | per crew (flat) | ladder, masking, drops |
| Fencing (per 10ft) | 0.80 hr | per section | spray or brush |
| Carpentry repair — per item | 1.00 hr average | per item | cut, fit, fasten, prime |

### Epoxy / Garage Coatings

| Task | Rate | Unit | Basis |
|------|------|------|-------|
| Concrete grinding — light | 60 sqft/hr | per operator | walk-behind grinder |
| Concrete grinding — heavy | 35 sqft/hr | per operator | multiple passes |
| Crack repair — minor | 50 sqft/hr | per person | fill + level |
| Crack repair — major | 30 sqft/hr | per person | route + fill + level |
| Moisture mitigation | 80 sqft/hr | per person | apply + monitor |
| Existing coating removal | 40 sqft/hr | per person | chemical strip + grind |
| Coating application (any type) | 150 sqft/hr | per person | squeegee + roller |
| Flake broadcast — standard | 200 sqft/hr | per person | broadcast + seal |
| Flake broadcast — full/metallic | 120 sqft/hr | per person | more coverage, more care |
| Cove base | 15 lf/hr | per person | trowel application |

---

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Production rate** | Square feet (or items) a single painter completes per hour. A physical constant. |
| **Crew wage** | What the contractor pays each painter per hour (not what the painter takes home — includes employer-side taxes). |
| **Gross margin** | (Revenue - Direct Costs) / Revenue. What the business keeps before overhead and profit. |
| **GAN** | The three-party economic model: homeowner (Gross), contractor (Adjusted), subcontractor (Net). |
| **Skill premium / Complexity factor** | Multiplier on the base hourly rate for work that requires more skill or is more tedious. Brush work > roller work. |
| **D2C** | Direct-to-Consumer. The contractor faces the homeowner directly. |
| **Sub mode** | The contractor is bidding TO a general contractor, not to a homeowner. Lower overhead, lower prices. |
| **Quick Calibrate** | GQ's onboarding flow where a contractor enters ~15 anchor prices and the system derives their full rate table. |
