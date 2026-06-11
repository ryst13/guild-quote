# GAN Overhaul — State Ledger

> Maintained by the Ralph loop. One entry per iteration. Backlog seeded from
> the configuration audit (`docs/audit/`, commit 2308305) filtered through the
> North Star philosophy. Priorities: P0 = trust/correctness (broken promises),
> P1 = Marcos usability, P2 = robustness/polish.

## Backlog

### P0 — Trust & correctness
- [ ] P0-1 Surcharges: wire `pricing_config.surcharges` into both engines (enable flags + amounts; defaults preserve byte-parity). Resolves SET-021..029.
- [ ] P0-2 Materials: wire `pricing_config.materials` (products, coverage, $/gal) into both engines. Resolves SET-031..038.
- [ ] P0-3 Payment terms: wire `deposit_pct` + `progress_threshold` into estimate output (templates/PDF/doc/sheets). Resolves SET-039/040, OUT-006.
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

(none yet — loop not started)

## Discovered items

(Critic findings that became new backlog rows get logged here with provenance.)
