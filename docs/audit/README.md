# GuildQuote Configuration Audit Register

Generated 2026-06-11. A complete inventory of every setting, configurable option,
module, pricing constant, and scope item in the product — built so Ryan can review
each line, record a decision, and hand the files back for implementation.

## The files

| File | Contents | Rows | How produced |
|---|---|---|---|
| `01-tenant-settings.csv` | Every tenant-facing setting and DB-only column | 70 | Authored from code audit |
| `02-engine-constants.csv` | Every hardcoded engine value: wages, production rates, modifiers, paints, surcharges, sqft lookups, thresholds | 122 | **Generated** by `scripts/audit-extract.mjs` |
| `03-scope-items.csv` | Every scope item (doors, windows, shingles, flake…) with its full economics: top-down price, bottom-up hours, complexity, sqft, material cost | 81 | **Generated** |
| `04-catalog-room-pricing.csv` | The top-down catalog price matrix (room × size × surface) | 45 | **Generated** |
| `05-modules-routes.csv` | Every page and API endpoint with auth and gating | 41 | Authored from code audit |
| `06-outputs-comms.csv` | Estimate document sections, output formats, emails | 18 | Authored from code audit |

Generated files can be refreshed after engine changes: `node scripts/audit-extract.mjs`.

## How to review

Open each CSV in Excel or Google Sheets. For every row, fill in:

- **Decision** — one of:
  - `KEEP` — correct as-is
  - `CHANGE` — wrong value/behavior; put the new value in **Target Value**
  - `REMOVE` — kill this option/feature
  - `ADD` — (on a new row) something missing
  - `?` — needs discussion
- **Target Value** — required for CHANGE rows
- **Notes** — context, reasoning, anything I should know

Leave Decision blank = not yet reviewed. Rows you don't care about can stay blank;
I'll treat blank as KEEP-for-now. Hand back the edited CSVs (or just tell me which
IDs changed) and I'll implement from them — the IDs are stable references.

## Pre-identified findings (the FLAGS column)

The audit itself surfaced these. They're marked in the Flags column of the
relevant rows and deserve decisions first, since several mean **the settings UI
is writing config that nothing reads**:

1. **The catalog editor is cosmetic (SET-041…050).** All six pricing functions
   accept the catalog as `_catalog` and never read it. The 360-cell room pricing
   matrix and all modifiers (wallpaper removal, furniture handling, ceiling
   heights…) have zero effect on quotes. Top-down prices actually come from
   hardcoded rates in `pricing.ts`.
2. **`pricing_config` is consumed by nothing (SET-021…040).** The Surcharges,
   Materials, and Payment Terms tabs save JSON no engine or template reads.
   Engines hardcode surcharge amounts and paint products; the estimate output
   hardcodes 30/30/40 deposits and the $10k progress threshold.
3. **Interior specialty options are collected but never priced (ITEM-018…023).**
   Drywall Install, Floor Refinishing, Plaster, Wallpaper, Window Cleaning, Room
   Cleaning — checkboxes on the scope form that affect nothing.
4. **Room-type list drift.** `catalog.json` has 15 room types (incl. "Home
   Office", "Stairwell"); the scope form and engines use a different 19-room
   list (incl. "Office", "Staircase Hallway", "Media Room", "Pantry"…). The
   catalog editor edits rooms the form never offers.
5. **Pro price inconsistency.** Billing page says GQ Pro $149/mo; strategy docs
   and CLAUDE.md say $129/mo.
6. **Snapshot language mismatch.** API supports en/es/fr; the UI offers
   EN/ES/PT/RO/YUE.
7. **`/api/estimate-pdf/[id]` serves PDFs unauthenticated** to anyone with the ID.
8. **Dead columns.** `stages_json`, `thresholds_json` (and the defaults files
   for them), `subscription_tier` — present but unused or deprecated.
9. **No way to change enabled trades after onboarding** (SET-051).
10. **Tier gating is thin.** Spec'd Pro-only knobs (complexity factor editing,
    economy-of-scale hours) are currently available to all tenants.

## Suggested review order

1. `03-scope-items.csv` — the item economics are the product's core; you know
   these numbers from the field.
2. `02-engine-constants.csv` — production rates, modifiers, wage table.
3. `01-tenant-settings.csv` — decide the NOT WIRED rows: wire them up or remove
   the UI (each one is currently a broken promise to the tenant).
4. `04-catalog-room-pricing.csv` — only matters if the catalog gets wired (finding #1).
5. `05` + `06` — module-level keep/kill and output polish.
