# Economy-of-Scale Pricing — Feature Spec

**Status:** Proposed (not built)
**Engine:** `pricing-v2.ts` (bottom-up) only — see §6
**Default:** OFF. Opt-in per tenant. Preserves RP-validated parity when disabled.
**Owner:** Ryan
**Related:** `bottom-up-pricing-engine-spec.md`

---

## 1. Problem

Both pricing engines price **strictly linearly**. Every line item is:

```
item_price = item_hours × qty × wage × complexity_factor ÷ (1 − margin)
```

There is no term anywhere that depends on total project size. **The 200th window in a
16-room job costs exactly the same as the 1st window in a 4-room job.** Verified in
`pricing-v2.ts` (`priceFromHours`, line ~375) and `pricing.ts`. The only things that
currently spread across a larger job are accidental: flat surcharges (trash, transport,
color samples) and one-time material gallon rounding.

This contradicts field reality. A larger job has a *lower* true cost per unit because:

1. **Mobilization is fixed per job** — load, drive, unload, mask, protect, clean up,
   re-load happen once regardless of size (~3–4 hrs).
2. **Repetition efficiency** — the Nth identical item is faster than the 1st (ladders
   already set, paint already cut in, rhythm established).

## 2. Why this is a deliberate feature, not a bug fix

The bottom-up engine was intentionally calibrated so its line items match RP's actual
Generator to <1% delta. **RP prices linearly too** — the complexity factors were
back-calculated from RP's flat rate tables. Adding a scale curve therefore *diverges*
from validated behavior. It must be:

- **Off by default** (parity with RP and with the top-down engine preserved).
- **Opt-in per tenant** via a setting.
- **Magnitude-validated against data** before the curve shape is trusted (see §5).

## 3. Model

Two layers. **Ship Layer 1 first.** Layer 2 is optional and strictly data-gated.

### Layer 1 — Mobilization split (the dominant, safe effect)

Introduce explicit fixed labor. Job hours become:

```
job_hours = mobilization_hours                      (fixed, once per job)
          + Σ_areas  setup_hours_per_area           (fixed, once per room/surface)
          + Σ_items  production_hours(item, qty)     (variable, as today)
```

Economy of scale emerges **automatically and is bounded** — per-unit cost falls as the
fixed block spreads, but total price can never drop below the variable cost. There is no
discount knob to mis-set; it is honest cost accounting.

- `mobilization_hours` — default ~3.5 (calibrate from data, §5). Interior currently has
  **zero** fixed time; exterior has a primitive `exterior_setup_per_surface = 1.0` that
  this generalizes and lifts to the job level.
- `setup_hours_per_area` — small per-room/per-surface fixed cost (masking, moving
  furniture). Default ~0.5.

### Layer 2 — Repetition-efficiency curve (optional, data-gated)

For identical repeated items beyond a threshold, decay the **variable** portion via a
learning curve, floored so unit time never collapses:

```
cumulative_hours(q) ≈ t · q^(1 + log2(L)) / (1 + log2(L))     for q > threshold
unit_time(n) ≥ floor_ratio · t                                 (hard floor)
```

- `L` = learning rate per doubling (e.g. 0.95 → 5% faster each doubling). **Fit from
  data, never guessed.**
- `floor_ratio` — physical minimum (e.g. 0.75). A window takes a real minimum time no
  matter how many you've done.
- `threshold` — units below which no decay applies (e.g. 5).

Apply per identical item type within a job (10 identical windows decay together; 2
windows + 8 doors do not pool).

## 4. Configuration & schema

New per-tenant columns (all nullable; null ⇒ feature off / use default):

| Column | Type | Default | Tier |
|---|---|---|---|
| `economy_of_scale_enabled` | boolean | `false` | GQ + Pro (toggle) |
| `mobilization_hours` | real | 3.5 | Pro (adjustable) |
| `setup_hours_per_area` | real | 0.5 | Pro (adjustable) |
| `repetition_curve_enabled` | boolean | `false` | Pro only |
| `repetition_learning_rate` | real | 0.95 | Pro only |
| `repetition_floor_ratio` | real | 0.75 | Pro only |
| `repetition_threshold` | int | 5 | Pro only |

When `economy_of_scale_enabled = false`, the engine path is **byte-identical to today**.

## 5. Prerequisites (do before shipping the curve)

### P1 — Fix the room-count data
`price-benchmarks.json` `interior_by_rooms` is corrupted: the `1-2` bucket (n=116)
medians **higher** ($5,668) than the `3-4` bucket (n=10, $3,813). The room-count field is
miscategorized upstream. Fix the categorization in the benchmark-build pipeline so size
buckets are monotonic and trustworthy.

### P2 — Calibrate from RP's 470 jobs
Regress `total_price ~ unit_count` (or `~ sqft`) across RP's historical jobs:

- **Intercept ⇒ `mobilization_hours`** (the fixed block).
- **Slope ⇒ true per-unit variable cost.**
- Negative residual trend at high volume ⇒ evidence for Layer 2; its shape sets `L`.

If the slope shows no per-unit decline, **do not ship Layer 2.** Layer 1 (fixed split)
is still valid on first-principles grounds and can ship regardless.

## 6. Why bottom-up only

The effect is about *hours* — fixed hours spreading, variable hours decaying. The
bottom-up engine computes hours then converts to price, so the levers are explicit. The
top-down engine multiplies `sqft × $/sqft` with no hours to bend; a scale discount there
would be a crude post-hoc haircut on the final dollar figure. Scale logic lives in
`pricing-v2.ts` exclusively. (`pricing_mode` must be `bottom_up` for the toggle to have
any effect; surface this in the settings UI.)

## 7. Risk — asymmetric underbid

Too-steep a discount **loses money and wins the bid** (low price ⇒ high close rate), so
the loss is guaranteed, and it lands on the largest jobs where dollars are biggest.
Overbidding merely loses a bid (free). The cost of error is heavily skewed toward "too
much discount." Mitigations:

- Hard floor (`floor_ratio`) so unit cost never drops below variable cost.
- Layer 1 ships first (mathematically can't underbid below cost).
- Layer 2 gated on P2 validation.
- A guardrail: never let `grand_total` fall below `labor_expense + material_expense`
  (i.e. positive gross profit always).

## 8. Implementation steps

1. Schema: add columns (§4) + migration.
2. `resolveSettings()` in `pricing-v2.ts`: read new fields with defaults.
3. Engine: add fixed-labor block to interior/exterior/epoxy; thread
   `economy_of_scale_enabled` so `false` ⇒ current code path.
4. (Layer 2) Add `applyRepetitionCurve(item_hours, qty, settings)` helper.
5. Settings UI ("Labor & Margins" tab): toggle + advanced (Pro) inputs, with a live
   preview showing a small vs large job side-by-side ($/room delta).
6. Update the validation harness and tests (§9).

## 9. Acceptance criteria

- **Parity:** with `economy_of_scale_enabled = false`, every existing pricing test passes
  unchanged (regression lock — see `pricing-v2.test.ts` linearity characterization tests).
- **Monotonic but sub-linear when enabled:** a 16-room job costs more in total than a
  4-room job, but **less per room**.
- **Floor honored:** no line item's effective unit time < `floor_ratio × base`.
- **Never unprofitable:** `grand_total ≥ labor_expense + material_expense` always.
- **Large-job sanity:** spot-check 3 real RP large jobs land within ±10% of actuals when
  calibrated.
