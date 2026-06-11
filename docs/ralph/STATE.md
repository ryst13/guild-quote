# GAN Overhaul — State Ledger

> Maintained by the Ralph loop. One entry per iteration. Backlog seeded from
> the configuration audit (`docs/audit/`, commit 2308305) filtered through the
> North Star philosophy. Priorities: P0 = trust/correctness (broken promises),
> P1 = Marcos usability, P2 = robustness/polish.

## Backlog

### P0 — Trust & correctness
- [x] P0-1 Surcharges: wire `pricing_config.surcharges` into both engines (enable flags + amounts; defaults preserve byte-parity). Resolves SET-021..029. **DONE iter 1.**
- [x] P0-2 Materials: wire `pricing_config.materials` (products, coverage, $/gal) into both engines. Resolves SET-031..038. **DONE iter 2.**
- [x] P0-3 Payment terms: wire `deposit_pct` + `progress_threshold` into estimate output (templates/PDF/doc/sheets). Resolves SET-039/040, OUT-006. **DONE iter 3.**
- [ ] P0-4 Catalog editor verdict: the 360-cell matrix is unread by engines (SET-041). Critic decides: wire a simplified ServiceTitan-style "price book" to the top-down engine, or remove the matrix in favor of calibration. Implement the verdict. Also resolve room-type list drift (catalog 15 names vs form/engine 19).
- [ ] P0-5 Interior specialty checkboxes (drywall install, floor refinishing, plaster, wallpaper, window cleaning, room cleaning) are collected but never priced (ITEM-018..023). Critic decides per item: price it, convert to a flagged note on the estimate ("quoted separately"), or remove. Silent no-ops are forbidden.
- [ ] P0-6 Secure `/api/estimate-pdf/[id]` — currently serves any PDF to anyone with the ID (MOD-033). Signed URLs or session auth; emailed links must still work for clients.
- [ ] P0-7 Snapshot language mismatch: API supports en/es/fr, UI offers EN/ES/PT/RO/YUE (MOD-031, OUT-012). Make them agree (PT matters for the user base; UI labels stay English).
- [ ] P0-8 Allow changing enabled trades after onboarding (SET-051) — currently impossible without DB access.

### P1 — Marcos usability
- [ ] P1-1 Plain-language pass: every label, helper text, empty state, and error across scope forms, dashboard, settings. 6th-grade English, concrete examples, no trade-software jargon.
- [ ] P1-2 Driveway test — scope entry on a phone: numeric keypads (`inputmode`), thumb-size targets, steppers over free inputs where sane, minimal required fields, no dead-end validation.
- [ ] P1-3 Settings consolidation: one "My Prices" mental model instead of Pricing (4 tabs) + Catalog as disconnected pages. Depends on P0-1..4 verdicts.
- [ ] P1-4 Dashboard: Jobber-style status-at-a-glance + one-tap quick actions (send, mark accepted/declined, duplicate). Surface "needs action" first.
- [ ] P1-5 Onboarding: measure and minimize time-to-first-estimate; sample-data preview before any setup; skip-everything path that still works.
- [ ] P1-6 Error handling sweep: no raw error text reaches the user; every failure says what happened and what to do, in plain words.
- [ ] P1-7 Estimate output polish vs PaintScout bar: typography, branding consistency (logo/colors actually applied), section order, mobile-readable PDF.

### P2 — Robustness & polish
- [ ] P2-1 Repeat-work speedups: duplicate-estimate flow prominence; recent clients; per-room "copy last room".
- [ ] P2-2 Demo route parity with current scope forms + output (it's the sales tool).
- [ ] P2-3 Docs pages (`/docs/*`) updated to match post-overhaul reality.
- [ ] P2-4 Dead schema cleanup decision: `stages_json`, `thresholds_json`, `subscription_tier` (SET-064..066) — document or deprecate (additive-only: mark deprecated, don't drop).
- [ ] P2-5 Tier gating review: which knobs are Pro-only per spec (complexity factors, economy-of-scale hours)? Implement gating consistent with $49/$129 positioning.

### Blocked (questions for Ryan)
- BLOCKED(question) Pro price: billing page says $149/mo, strategy says $129/mo. Which is correct? (No code change until answered — guardrail 2.)

## Iteration log

### Iteration 1 — P0-1 surcharge wiring — Critic: REJECT → all findings fixed in-iteration
**Builder:** New `pricing-config.ts` resolver (`resolveSurcharges`, defaults = historical
constants). `TenantConfig.pricing_config` now parsed in `buildTenantConfig`. All six engine
functions honor enable flags + amounts (v2 via tenant, v1 via optional param; demo keeps
defaults). 7 new tests; 56/56 pass; parity verified byte-identical at null config.
**Critic findings & resolutions:**
1. [CRITICAL] Settings page double-parsed the now-pre-parsed config → always showed
   defaults and Save would revert live pricing. FIXED: page uses parsed object directly.
2. [HIGH] `pricing-config.ts` untracked → diff didn't build standalone. FIXED: committed.
3. [MEDIUM] Scope forms hardcoded "$98.95"/"$50" labels. FIXED: forms take amounts as
   props; dashboard/new passes tenant-resolved values; disabled surcharge hides the price.
4. [MEDIUM] Quick Calibrate replaced the whole pricing_config (would stomp tenant's
   disable choices + materials). FIXED: merge semantics — calibration-derived amounts
   overwrite, tenant choices survive.
5. [LOW] Enabled surcharge at $0 printed a $0.00 line. FIXED: zero-amount guards.
**Notes for future iterations:** settings-page preview claims and any other hardcoded
dollar copy should be checked whenever a config value gets wired (pattern from finding 3).

### Iteration 2 — P0-2 materials wiring — Critic: ACCEPT (1 MEDIUM logged, 2 LOWs fixed)
**Builder:** `resolveMaterials()` + `DEFAULT_MATERIALS` in pricing-config.ts (defaults =
historical constants; coverage<=0 and cleared fields fall back safely). All six engine
functions read tenant materials; legacy engine's 4th param refactored to an
`EngineConfig` options object before the positional shape ossified. 6 new tests; 62/62.
**Critic findings:** [MEDIUM] Materials tab gives no feedback when an invalid value
(coverage 0, cleared product) is silently replaced by a default → logged as D-1.
[LOW] partial-config crash landmine on settings page → FIXED (per-section merge over
defaults). [LOW] no top-down materials test → FIXED (added).

### Iteration 3 — P0-3 payment terms — Critic: REJECT → fixed → re-verified ACCEPT
**Builder:** `resolvePaymentTerms()` (deposit % clamped 0–90, threshold ≥ 0, NaN-safe);
both assemble functions take optional payment param; generate/regenerate/epoxy-legacy-PDF
callers pass tenant terms. Progress payment stays a fixed 30% slice, skipped when
deposit > 60%.
**Critic round 1 (REJECT):** [HIGH] settings preview modeled progress=deposit% and could
show negative completion → preview rewritten to match the engine (incl. >60% rule, 90%
cap). [HIGH] `1 − 0.3 − 0.3` float math broke $-parity on ~0.2% of totals → completion is
now remainder-based so deposit+progress+completion === round(total) ALWAYS (sweep-tested);
Critic's own recommendation, strictly more correct than the old independent rounding.
[MEDIUM] epoxy legacy PDF ignored terms → wired. [MEDIUM] UI max 100 vs clamp 90 → max=90
+ helper text. [LOW] NaN via raw API → sanitized. Re-verify Critic ran a 1M-cent sweep:
every divergence from old amounts is a case the old code failed to sum to total. ACCEPT.
**Pattern reinforced:** wiring config to output means the settings preview is part of the
contract — check it every time (same class as iter-1 finding 3).

## Discovered items

- [ ] D-1 (from iter 2 Critic, MEDIUM): Materials/Surcharges inputs need inline
  validation + "using default: X" feedback when the engine falls back (coverage <= 0,
  cleared product/price). Fold into P1-1 plain-language pass or P1-6 error sweep.
