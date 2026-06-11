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
- [x] P0-4 Catalog editor verdict — Critic adjudicated **Option B**: dead editor retired, replaced with a read-only Price Book computed live by the real engines; room-list drift resolved via shared `scope-options.ts`. **DONE iter 4.**
- [x] P0-5 Specialty checkboxes — Critic upheld "exclusion note, not priced" for all six
  (pricing without validation data = asymmetric underbid trap; removal would lose real
  walkthrough data). Estimate + snapshot now carry explicit "quoted separately" lines;
  form copy states no price effect; totals locked by test. **DONE iter 5.** Bonus: fixed
  recap-table index shift under economy of scale (interior + exterior, both tested).
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

### Iteration 4 — P0-4 catalog verdict + Price Book — Critic: adjudicated B, build REJECT → fixed
**Adjudication:** Critic independently verified the evidence (catalog_json read by nothing;
matrix rooms ≠ form rooms; modifiers have no scope inputs) and ruled Option B with 10
constraints: real-engine computation only, frozen engines untouched, shared room/item
module, plain-language baseline first, no fake affordances, phone-first cards, catalog_json
kept-but-unread + neutral note for tenants who had customized it, nav/docs hygiene,
server-side compute with per-row fallback, both engines honored and labeled.
**Builder:** `scope-options.ts` (single source for 19 rooms / 13 items / 6 specialties,
imported by form + price book); `price-book.ts` (~70 real engine invocations/page, ≈5ms);
page rebuilt in place; nav renamed "Price Book"; CLAUDE.md/README updated. 4 new tests
incl. the row-equals-real-quote-section invariant and the engine-switch lever proof.
**Build-review Critic: REJECT** → fixed in-iteration: [HIGH] type lie (`as
InteriorScopeData` hiding missing client.notes; RoomSize union) → properly typed, casts
deleted; [MEDIUM] malformed catalog_json 500'd every page via unguarded JSON.parse in
tenant.ts → guarded to defaultCatalog; [LOW] vacuous engine-switch assertion hardened;
[LOW] dead payload field dropped. Zero type errors in touched files after fix.

### Iteration 5 — P0-5 specialty exclusions + recap index bug — Critic: ACCEPT
**Builder:** Per-room "Not included in this price (quoted separately): …" bullet on the
estimate; crew-facing "Quoted separately (not this job)" line on snapshots; plain form
copy; price-identity test. Discovered + fixed: recap rows indexed `sections[i]`, which
the Setup & Mobilization section shifted off-by-one under economy of scale — interior and
exterior recaps now index room sections only, regression-tested both.
**Critic:** upheld the disposition for all six items (incl. Window/Room Cleaning — no
validated rates, don't invent them). Logged D-5 (Google Docs output is structurally not
the 8-section estimate), D-6 (epoxy collected-but-silent inputs), D-7 (job-level
Exclusions block + structural section tagging). Snapshot fix + exterior recap test were
applied in-iteration at its prompting.

## Discovered items

- [ ] D-1 (from iter 2 Critic, MEDIUM): Materials/Surcharges inputs need inline
  validation + "using default: X" feedback when the engine falls back (coverage <= 0,
  cleared product/price). Fold into P1-1 plain-language pass or P1-6 error sweep.
- [ ] D-2 (from iter 4 adjudication): editable per-item rate overrides — the true
  ServiceTitan price book. Requires wiring rate overrides into both engines with a
  byte-parity lock at defaults (else it re-creates Option A's validation problem
  through the back door). Substantial; schedule after P1-3.
- [ ] D-3 (from iter 4): Price Book covers interior only; add exterior/epoxy sections
  (same real-engine computation pattern) when P1-3 consolidates settings.
- [ ] D-4 (from iter 4, LOW): onboarding +page.server.ts still serializes `catalog`
  into a page that never reads it — drop during P1-5 onboarding pass.
- [ ] D-5 (from iter 5 Critic, HIGH class but pre-existing): Google Docs output never
  renders the 8-section EstimateDocument (no work descriptions, no surface grade, no
  payment terms — just raw line items), so it also misses the new exclusion bullets.
  Rebuild createEstimateDoc on EstimateDocument during P1-7 output polish.
- [ ] D-6 (from iter 5, LOW): epoxy collects timeline + notes that reach no output;
  epoxy also bypasses the template engine entirely (legacy PDF path). Same
  collected-but-silent class — fold into P1-7.
- [ ] D-7 (from iter 5, LOW): add a rolled-up job-level "Exclusions" block near payment
  terms (PaintScout/Jobber convention) on top of the per-room bullets; rephrase
  Window/Room Cleaning as "separate services available on request". Exterior recap
  filter keys on the literal section label — tag sections structurally instead.
