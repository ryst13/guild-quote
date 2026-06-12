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
- [x] P0-6 Secure `/api/estimate-pdf/[id]` — session auth + tenant ownership (admin
  override), strict UUID filename validation via unit-tested pure module (also closed a
  Windows path-traversal READ the audit missed), 404-not-403 for other tenants, HTML
  requests redirect to login. Emails attach PDFs (no links) so nothing client-facing
  broke. Critic also found the same class on the WRITE side (snapshot lang →
  writeFileSync) — closed in-iteration with an allowlist. **DONE iter 6.**
- [x] P0-7 Snapshot language mismatch — **AUDIT CLAIM STALE** (verified iter 7 via git
  history: en/es/pt/ro/zh-yue from first commit; "fr" never existed). Residual value
  shipped: language list single-sourced in `lib/languages.ts` (page duplicate removed);
  landing page copy corrected to all five languages. **CLOSED iter 7.**
- [x] P0-8 Enabled trades editable on Settings > Profile: three checkboxes, last-trade
  lock (client) + non-empty-subset validation (server), plain copy promising
  reversibility; old estimates stay viewable/regenerable. **DONE iter 7.**

### P1 — Marcos usability
- [x] P1-1a Plain-language pass, slice 1: scope forms + /dashboard/new + /demo chrome.
  **DONE iter 8.** Software jargon killed (Generate/Builder/Dismiss/Network error);
  Surface Grade + Prep Level got accurate one-line explanations; errors say what to do
  next. Critic REJECT round caught: fixed room dimensions would have mis-steered the
  most price-sensitive input (engine S/M/L are relative per room type) → replaced with
  a relative-semantics helper line; starter-prices banner stated a falsehood → made
  conditional; demo chrome aligned.
- [x] P1-1b Plain-language slice 2: dashboard, estimate page, send, pricing + billing
  settings (~50 edits); Won/Lost adopted as the single status vocabulary (display-only);
  estimate Duplicate→Copy; D-1 inline fallback notes; pricing_reviewed flag set by both
  pricing save AND calibrate; prompts_shown made merge-only and persistent. **DONE
  iter 9.** Critic REJECT round fixed: my D-1 note falsely claimed $0 price is ignored
  (it's valid paint pricing); <a>-in-<button> invalid HTML; docs still taught
  Accepted/Declined; calibrate path missed the banner flag.
- [x] P1-2 Driveway test: QtyStepper component (40px tap targets, numeric keypad,
  nonzero highlight) replaces all 18 tiny quantity inputs across the three forms;
  responsive single-column grids at phone width; epoxy free-number inputs get numeric
  keypads; Copy/Remove get real tap padding; client name is the only required field,
  enforced with a jump-back + inline message instead of a dead end. **DONE iter 10.**
  Critic REJECT round: epoxy form's message never rendered (silent bounce), exterior
  item grids missed the responsive fix exactly where steppers landed, leftover
  parseInt type error — all fixed; stepper capped at 999 (spindle counts), shrink-0
  guards keep tap targets honest.
- [x] P1-3 Settings consolidation: the pricing page is now "My Prices" with the Price
  Book as its first tab (shared PriceBookView component; in-place tab links); Labor
  Multiplier relocated from the Surcharges tab to Labor (Rate-Based only, renamed
  "Price Level"); Output Format + LOSP moved to a new Estimate Output tab; old catalog
  URL 308-redirects; nav unified to one "My Prices" entry. **DONE iter 11.** Critic
  REJECT round fixed: admin nav not renamed, /docs still teaching the dead catalog
  editor, CLAUDE.md/README/audit-register staleness, whitespace residue.
- [x] P1-4 Dashboard quick actions: status-aware one-tap row actions (Send / Won /
  Lost / Copy / View) with an 8-second Undo toast; undoing a mis-tapped Lost also moves
  the Drive folder back (update endpoint now mirrors folder state symmetrically);
  needs-action-first ordering (drafts, then sent, newest within groups); plain-language
  failure banner; all actions disabled while any request is in flight. **DONE iter 12.**
  Critic REJECT round: one-tap irreversible status changes with no recovery (fixed via
  undo + symmetric folder move), busy-state leak, toSorted browser floor, misleading
  partial-failure errors — all fixed.
- [x] P1-5 Onboarding: finishing now lands on /dashboard/new ("Create Your First
  Estimate"); step 2 opens with a real engine-computed sample ("a typical 3-room
  repaint quotes around $X") using the tenant's ACTUAL engine + demo link; banner
  recomputes after calibration; skip paths verified intact; D-4 closed (dead catalog
  payload removed); stale CLAUDE.md 5-step claim fixed. **DONE iter 13.** Critic
  REJECT round: my sample used the bottom-up engine for top-down tenants — a 16%
  mis-anchor on the default path (computed both engines to prove it) → engine now
  selected by pricing_mode via the exported runInteriorEngine.
- [x] P1-6 Error sweep: 20 silent failure paths fixed across 9 files (sub-builder
  inventory: 20 SILENT / 0 RAW / 4 OK). Headline: the send endpoint returned HTTP 200
  {success:false} on email failure and the page celebrated "Estimate Sent" anyway —
  endpoint now 502s with a plain error, page checks success + offline. Billing buttons
  can't wedge disabled; onboarding saves await + gate step advance; estimate-detail's
  ten handlers share a header error indicator; profile/pricing saves gated on res.ok;
  auth wording de-jargoned. **DONE iter 14.** Critic REJECT round: regenerateEstimate
  was still unwrapped (stranded spinner), saveClient still false-successed, stale
  actionError re-surfaced after later successes, dead onboarding state — all fixed.
- [x] P1-7a Output structural parity (absorbs D-5 + D-6): new assembleEpoxyEstimate
  gives epoxy the full 8-section document (per-floor work descriptions, real recap
  prices — previously EMPTY; timeline/notes now reach output; honest Good→A grade
  mapping; epoxy-true prep copy). createEstimateDoc renders the structured document
  (Google Docs finally matches the PDF). Both endpoints unified: one assembled doc
  drives Sheets/Docs/PDF for all three trades incl. regenerate; epoxy+Sheets works;
  dead legacy PDF path deleted. **DONE iter 15.**
- [x] P1-7b Output polish: tenant logo embedded in the PDF header (PNG/JPEG,
  fit-or-shrink-or-skip so it can never collide with the contact block; happy-path
  tested with a real PNG; profile copy now states the format rule); D-7 closed —
  job-level "Not Included in This Estimate" rollup in PDF/Docs/Sheets alongside the
  per-room bullets; recap reconciliation line in all three renderers (SIGNED residual:
  "Setup & surcharges" or "Adjustments & discounts" — the Critic proved a clamped
  version hid real negative residuals for rate-based Basic-prep tenants); Docs renderer
  now prints cents consistently. **DONE iter 16.**

### P2 — Robustness & polish
- [x] P2-1 Repeat-work speedups: "Recent clients — tap to fill" chips on step 1 of all
  three forms (tenant-scoped, deduped, hidden in demo; fills + clears validation);
  estimate Copy (dashboard + detail) and per-room Copy shipped in iters 5/12.
  **DONE iter 17, Critic ACCEPT.**
- [x] P2-2 Demo: structural parity verified (shared forms + live engine output); the
  "Start Trial" lead capture was a FALSE PROMISE — email went into local state, nobody
  would "reach out" — now a real form straight into trial registration with the email
  prefilled (works on Enter and without JS); header CTA aligned; stale docs fixed.
  **DONE iter 18, Critic ACCEPT.**
- [x] P2-3 Docs refresh: every catalog-editor reference → Price Book/My Prices; Won/Lost
  vocabulary; all five snapshot languages; real settings page names; the phantom
  "viewed is tracked" claim replaced with the truth. **DONE iter 19.**
- [x] P2-4 Dead schema: DEPRECATED comments on catalog_json (nothing writes it; legacy
  rows parsed but ignored by engines), stages_json/thresholds_json (never wired),
  subscription_tier (superseded by plan); register rows updated; columns kept
  additive-only. **DONE iter 19.**
- [x] P2-5 Tier gating: the FEATURE_MATRIX was pure decoration — a $49 tenant got every
  Pro feature and an EXPIRED-TRIAL tenant could still generate, send, duplicate, and
  regenerate. Now enforced server-side, mirroring the billing page promises 1:1:
  generate/regenerate/duplicate/snapshot gate on canGenerate; send + notify on
  canSendEmail; Docs/Sheets creation (incl. snapshot sheets) on canUseGoogleDocs (PDF
  always produced — the GQ promise); PDF/snapshot branding neutralized when
  !canUseWhiteLabel; non-EN snapshots Pro-only; benchmarks Pro-only (basic stats stay
  for all). 402 messages actually REACH users (clients read error bodies); GQ tenants
  no longer see a fake "files missing" failure state. 6 matrix unit tests. **DONE
  iter 20.** NOTE resolved iter 22: Ryan opted to include branding at $49; whiteLabel moved
  into the GQ column.

### LR — Launch readiness (added 2026-06-11 from Ryan's launch decisions)
- [x] LR-1 Drop `gmail.send` restricted scope (Ryan: option C). All email — estimates,
  notify-style, transactional — now goes via SMTP/Resend from GuildQuote's domain with
  the contractor's company name and their email as Reply-To (SPF/DKIM align; replies
  still reach the contractor). Gmail-API send branch deleted; OAuth keeps only
  drive.file + documents (no Google verification gauntlet for a restricted scope).
  Every Gmail promise in copy fixed: homepage, demo, send page, docs (2), onboarding,
  privacy, terms. /upgrade rewritten from vapor (Kanban/eSign/portal features that
  don't exist; GQ column claiming Pro features) into an honest public Pricing page
  matching FEATURE_MATRIX + billing 1:1, with logged-in-aware CTAs. Unreachable
  notify endpoint deleted (Critic disposition). **DONE iter 21.**
  require Google security assessment); estimate emails default to Resend/SMTP from a
  GuildQuote domain; keep drive.file + documents scopes for Docs/Sheets output. Update
  the send flow copy accordingly.
- [ ] LR-2 Deployment rig (build when Ryan green-lights pre-launch): Fly.io single
  instance + persistent volume (SQLite + PDFs) + Litestream backups to object storage;
  prod env vars; Resend keys; Sentry; uptime monitor. Stripe live mode + $129 Pro Price
  object + webhook — gated on Ryan's entity/banking step.

### Resolved questions
- ~~Pro price $149 vs $129~~ → **Ryan decided $129 (2026-06-11)**; all six UI displays
  fixed. Stripe live Price must be created at $129 (LR-2).
- Hosting → most cost-effective reliable option; loop's standing choice: **Fly.io +
  Litestream** (single instance fits SQLite + local PDF storage).
- Entity/banking/legal review → Ryan handles directly, right before ship.

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

### Iteration 6 — P0-6 PDF endpoint security — Critic: ACCEPT
**Builder:** auth + ownership + traversal-proof filename parsing (pure `pdf-access.ts`,
unit-tested incl. backslash/encoding attacks). **Critic:** fuzzed the regex with 500k
mutated suffixes (zero traversal matches), verified hooks populate locals.user on /api
routes, swept all consumers for breakage (none — emails attach, dashboard links are
same-origin authenticated), confirmed all submission IDs are UUIDv4. Found the WRITE-side
twin (unvalidated snapshot `lang` into writeFileSync) → allowlist fix applied
in-iteration. Note: P0-7's premise may be stale — the snapshot API's SUPPORTED_LANGUAGES
already matches the UI's five (en/es/pt/ro/zh-yue); verify next iteration. LOW logged:
tenant-less platform admin is locked out of PDFs (no such user exists today).

### Iteration 7 — P0-7 (stale, closed) + P0-8 trades editing — Critic: ACCEPT
**P0-7:** Critic independently confirmed staleness via `git log -S "'fr'"` (never in the
code). Lesson recorded: audit-register rows are claims, not facts — verify before
building. **P0-8:** trades card on Profile; round-trip uses onboarding's exact wire
format; Critic verified view/regenerate/duplicate of disabled-trade estimates keep
working and the zero-trades race is closed by Svelte's synchronous flush. Its MEDIUM
(no server-side validation on /api/tenant/update) was fixed in-iteration with a
non-empty-subset guard; copy/landing-page/hygiene LOWs swept.
**Open decision logged (D-8):** duplicating a disabled-trade estimate still creates a
draft of that trade — coherent with reversibility, but flag for a conscious choice.

### Iteration 8 — P1-1a plain-language slice 1 — Critic: REJECT → fixed → green
**Builder:** 30-edit copy pass (sub-builder inventoried, I applied): scope forms,
/dashboard/new. Trade vocabulary untouched; software jargon killed; product concepts
explained in place; every error now states what happened + what to do.
**Critic (localization-editor mode): REJECT** — [HIGH] hard-coded room dimensions in the
size dropdown only fit a Bedroom; engine S/M/L are per-room-type (a "Large 14x16" living
room would price as 800 sqft wall ≈ +67%) → reverted to plain S/M/L + helper teaching the
relative semantic. [MEDIUM] new banner copy asserted "starter prices, not yours" but the
flag never reflects actual pricing-save state → conditional phrasing now, logic fix queued
in P1-1b. [MEDIUM] /demo shares the forms but kept old chrome strings → aligned. [LOWs]
epoxy review label, dims invisible in narrow selects anyway (moot after revert).
**Meta-lesson recorded:** copy that encodes numbers is pricing surface, not prose — the
Critic reviews it against the engine, not against style.

### Iteration 9 — P1-1b plain-language slice 2 — Critic: REJECT → fixed → green
**Builder:** sub-builder inventoried ~50 edits with RISKY flags; I verified each risky
claim against code before applying — including discovering the price-adjustment helper
contradiction (the page claimed adjustments appear as a separate markup line; the
endpoint actually rescales every line proportionally — false copy replaced both places).
Mechanical: prompts_shown.pricing_reviewed now set by update-pricing AND calibrate (both
modes); prompts_shown writes are merge-only so banner dismissals can't clobber flags.
**Critic REJECT** caught me re-committing the exact sin this slice fixes: my materials
fallback note claimed "zero is ignored" while $0/gallon is valid → reworded truthfully.
Plus invalid <a>-in-<button>, docs vocabulary drift, calibrate flag gap — all fixed.
**Standing rule now in the ledger: every fallback/helper sentence must be checked
word-by-word against the resolver condition it describes.**

### Iteration 10 — P1-2 driveway ergonomics — Critic: REJECT → fixed → green
**Builder:** QtyStepper (controlled −/+ component, Svelte-5-verified sync), 18 input
replacements, responsive grids, tap padding, name-only validation with no dead ends.
**Critic:** probed the stepper's compiled set_value semantics (type-5-then-plus shows 6 ✓),
then rejected on three real gaps: epoxy validation message never rendered (my anchor
string didn't exist — silent replace miss), exterior's five item grids kept grid-cols-2
at 390px exactly where the steppers landed (tap targets would compress), and a leftover
parseInt on the changed signature. All fixed; svelte-check back to the 14-error baseline.
**Process lesson recorded: every scripted string-replace must assert its expected match
count — the two misses this iteration were silent zero-match replaces.**

### Iteration 11 — P1-3 settings consolidation — Critic: REJECT → fixed → green
**Builder:** Price Book becomes the front door of one consolidated "My Prices" page
(6 tabs, flex-wrap to 3 readable rows at 390px); misplaced controls rehomed; deep links
via validated ?tab= params; catalog URL kept alive as a permanent redirect.
**Critic:** verified the tab chain integrity, save-path persistence (hidden multiplier
survives Cost-Based saves), the multiplier's top-down-only scoping, SSR safety, and the
~71-engine-call page load cost (single-digit ms — eager is fine). Rejected on
consistency: admin nav, user docs, and project docs all still described the old
structure — "one mental model" includes the documentation. All fixed; 308 over 301.
**LOW noted (latent):** activeTab doesn't track ?tab= changes during client-side nav —
no in-app link does this today.

### Iteration 12 — P1-4 dashboard quick actions — Critic: REJECT → fixed → green
**Builder:** one-tap Send/Won/Lost/Copy per row, needs-action sort, error banner.
**Critic REJECT (the right call):** one mis-tap permanently corrupted win-rate analytics
and fired a one-way Drive folder move, with zero recovery affordance anywhere in the app
— while the detail page gates the same transitions behind confirm modals. Fix shipped:
Jobber-style 8s Undo toast; the update endpoint now moves the Drive folder BOTH ways
(leaving declined restores Active), so undo is complete; busy state disables all rows;
toSorted replaced for older-browser safety; partial-failure error messages no longer lie.
**D-8 ruled KEEP** (see backlog). Verified fine: close_price one-tap default matches the
detail modal's own fallback; decline_reason has no downstream consumer; cmd-click works.

### Iteration 13 — P1-5 onboarding — Critic: REJECT → fixed → green
**Builder:** finish lands in estimate creation; real sample number on the pricing step;
D-4 dead payload removed. **Critic REJECT:** the sample ran calculateInteriorBottomUp
unconditionally while fresh tenants are top_down — it computed both engines on the exact
sample scope and proved a −15.9% mis-anchor at fresh-tenant defaults (parity only holds
near the calibration point). Fixed by exporting price-book's engine selector
(runInteriorEngine) and using it; banner now recomputes after calibration
(invalidateAll); noopener added. Pre-existing noted: Google connect re-enters onboarding
at step 1 (step is local state) — log for P1-6/P2 if it bites.
**The recurring lesson now has a name in this ledger: ANCHOR NUMBERS RUN THE REAL PATH —
any displayed dollar figure must be produced by exactly the code path the tenant's real
estimates will take.**

### Iteration 14 — P1-6 error sweep — Critic: REJECT → fixed → green
**Builder:** 24-path inventory (sub-builder), then three scripted batches. The send
false-success was the worst trust bug found by the whole loop: contractor walks away
believing the client got the estimate when both Gmail AND SMTP failed.
**Critic:** verified the send 502 is strictly more truthful even in no-SMTP dev (the old
behavior showed success while NO email left and the DB was never marked sent — a lie);
verified onboarding gating order and brace integrity of script-applied wraps. REJECTED
because two of ten claimed handlers weren’t actually wrapped (regenerateEstimate spinner
strand, saveClient false Saved) and stale errors re-surfaced — i.e., the sweep’s own
defect classes in its flagship file. All fixed.
**Backlogged for the demo (P2-2): the demo’s "Start Trial" email capture performs no
network call at all — emails go nowhere (sub-builder discovery).**

### Iteration 15 — P1-7a output structural parity — Critic: REJECT → fixed → green
**Builder:** assembleEpoxyEstimate (epoxy estimates previously shipped with EMPTY work
descriptions and recap tables, hardcoded grade B, dropped timeline/notes); structured
Google Docs renderer; endpoint unification. **Critic REJECT:** regenerate was only
half-converted — a price adjustment would silently downgrade the Doc back to the legacy
dump, and epoxy+Sheets still fell through on regenerate; plus the epoxy copy lied
(Good floor shown as "Moderately Deteriorated"; prep section promised spackle and nail
holes on a garage floor, advertising unpriced tiers). All fixed: one doc per request in
BOTH endpoints, Good→A, epoxy-true prep copy, dead legacy path deleted.

### Iteration 16 — P1-7b output polish — Critic: REJECT → fixed → green
**Critic's two HIGHs were both empirical:** it reproduced a top-down Basic-prep quote
whose recap rows exceeded the grand total by $74.62 — my Math.max(0,…) clamp silently
hid the mismatch the feature claimed to eliminate (the rate-based engine's Basic prep
is a NEGATIVE surcharge) → residual is now signed and labeled honestly. And it computed
pdf-lib text metrics to show long company names drive the logo into the contact column
→ logo now fits-shrinks-or-skips within the available slot. Also fixed: untested logo
happy path (real-PNG test, self-sufficient fixture), SVG/WebP honesty in profile copy,
Sheets exclusions placement + label clipping, Docs cents consistency.
**Ledger lesson reinforced: clamps that "can't happen" are how reconciliation bugs
hide — render signed truth instead.**

### Iteration 17 — P2-1 recent clients — Critic: ACCEPT (2 LOWs fixed in-iteration)
Tenant-scoping verified (no cross-tenant leak); all three forms verified for state-var
names, balanced blocks, demo exclusion. LOWs fixed: chip tap now clears the stale name
validation message; dead projection field dropped.

### Iteration 18 — P2-2 demo — Critic: ACCEPT (P3 nits swept)
The sales tool's only conversion button silently discarded every lead behind "We'll
reach out when your trial is ready." Now it starts the actual 14-day trial. Critic
verified $app/state usage, SSR safety, XSS-escaping of the reflected param, and that
no backend capture ever existed (strictly-better change). P3s applied: GET form for
Enter/no-JS, import hoist, trim, header CTA consistency, CLAUDE.md staleness.

### Iteration 19 — P2-3 + P2-4 docs/schema hygiene — Critic: REJECT → fixed → green
**Critic earned it on a "trivial" iteration:** my catalog_json deprecation comment
asserted a phantom writer (grep: onboarding writes no catalog), and the sweep missed
three catalog references in the body of the very page the diff touched. It also surfaced
docs claiming features that don't exist ("viewed is tracked when they open the email" —
nothing sets viewed), wrong settings page names, and three-language claims vs five.
All fixed. Standing rule reaffirmed: deprecation comments are claims — grep before
asserting writers/readers.

### Iteration 20 — P2-5 tier enforcement — Critic: REJECT → fixed → green
**Builder:** server-side gates matching the billing page 1:1. **Critic REJECT (both
MAJORs were the product's own prior lessons coming home):** my 402 messages were
unreachable — the P1-6 error handlers masked them with generic retry advice (gates as
dead ends, the exact P1-6 sin); and GQ+Google tenants would see a perpetual "files
missing / check your Google connection" failure state for the Docs they aren't sold.
Plus bypass hunt: notify endpoint sent ungated email; expired tenants could duplicate/
regenerate/snapshot (generation by another name); snapshot sheets and snapshot-PDF
branding missed their gates. All fixed; error bodies now flow to users everywhere;
fail-closed gating on in-scope tenant; matrix unit-tested.

### Iteration 21 — LR-1 drop gmail.send, SMTP-only email — Critic: REJECT → fixed → green
**Builder:** scope drop + send-path rewrite + copy sweep + /upgrade de-vaporized.
**Critic REJECT (3 MAJOR):** the iteration's own thesis — stop promising what the
product doesn't do — and I left the homepage Pro card selling "job tracking,
scheduling, follow-ups, payments, crew management" (none exist), left the dashboard
Pro banner selling the same, and re-typed "Track who opened it" in a line I edited
(no open tracking exists anywhere). Also: /upgrade's big CTA sent logged-in users to
register (dead end: "account already exists"); "replies go to your email" unguaranteed
when contact_email blanked; privacy policy stopped disclosing the email provider right
as it became the only email path. All fixed: real Pro copy everywhere, annual-price
claims removed (no annual SKU exists), logged-in-aware CTAs, blank-email warning on
send page linking to Settings, email-provider privacy bullet, docs mention trial.
**Standing rule:** when the iteration is "purge false promises," grep the WHOLE
surface for the promise class — not just the lines that mention the old mechanism.

### Iteration 22 — Ryan-directed: branding included at GQ ($49)
Ryan reviewed the iter-20 note and decided branding belongs in the base tier.
FEATURE_MATRIX gq.whiteLabel -> true; sales copy moved the logo/branding bullet from
the Pro column to the GQ column on billing, /upgrade, and homepage; docs already said
"every document carries your branding" and are now simply true. The brandTenant
neutralization stays in the endpoints (still guards expired/edge states and
future tiers). Matrix test asserts GQ canUseWhiteLabel=true.

### Iteration 23 — Full-app Critic sweep #1 (3 parallel lenses) — FINDINGS → all fixed → green
First completion-check sweep. Three adversarial critics (security / Marcos-truth /
correctness) ran against the whole app. NOT clean — 1 CRITICAL, 9 HIGH across lenses,
all fixed in-iteration plus the moderates and most lows:

**Security:** CRITICAL unauthenticated path traversal in /api/logo/[filename]
(`..\guildquote.db` would download the entire multi-tenant DB — the unhardened twin
of the iter-6 PDF fix). HIGH stored-XSS via SVG logos (uploads now magic-byte
validated, PNG/JPEG/WebP only; legacy SVGs served CSP-sandboxed). OAuth login CSRF
(state param added). logo_url write-validation + confined read in pdf.ts. Send-message
HTML escaped. Rate limits on demo/magic-link/register.

**Marcos/truth:** homepage led with the forbidden "470+ real projects" claim (brand
rule #1) + unsourced "48% vs 30-35%" stat — replaced. Homepage Pro card + upgrade FAQ
annual-price claims removed earlier; this sweep killed the remaining vapor: Estimate
Insights panel deleted (Pro branch said "Coming soon", teaser blurred FABRICATED
numbers, "Win probability" is the Boston ML we must not ship); referral card removed
(/r link was read by nothing, no credit ever applied); docs/tracking rewritten to the
benchmarks that exist (was selling trend lines/pipeline value/decline breakdowns);
Boston benchmark message no longer rendered in demo + dashboard/new (engine field
stays, display suppressed); "Client Views" dropped from demo pipeline; Create Doc
button Pro-gated; docs password copy fixed (no passwords exist); trial countdown
banner (≤3 days) + expired-trial blocks BEFORE the scope form; Pro tease hidden from
Pro users; phone grids responsive (7 grids + 2 navs); plain-language pass (sign-in
link button, LOSP spelled out, support@ contact added).

**Correctness:** HIGH Google-OAuth signups got NO trial (payment_status 'none' =
locked out of first estimate) — now same 14-day trial as email signup. HIGH Stripe
webhook read plan from session metadata (always empty) — every buyer activated as
'gq' including $129 Pro purchases; now reads subscription metadata. HIGH Quick
Calibrate anchors were write-only — now derive labor_price_multiplier (clamped
0.7–2.5, only from anchors the user typed), so entered prices actually scale every
estimate; per-item overrides stay deferred as D-2. HIGH Edit Prices silently dropped
the 10% materials wastage from the grand total — wastage delta now preserved.
MODERATEs: "PDF Only" output honored end-to-end (no Docs created, no false "missing
files" warning); show_losp toggle actually controls the prep menu in PDF+Docs+Sheets;
Sheets now renders Section 4 (prep level) and got 1000 grid rows; regenerate checks
the paywall BEFORE writing; version bumps only on real price changes; send 400s on
missing PDF instead of mailing "find attached" with nothing attached; re-send no
longer knocks Won/Lost back to 'sent'; first generate creates + persists the Drive
project folder (Won/Lost moves now work without a regen; regenerate persists it too);
magic-link failure honest in prod; Drive queries escape apostrophes; delete cleans
snapshot PDFs; PDF recap truncates long area names; server-side scope cap (40).

**Known-issue log (LOW, deliberate):** bottom-up tenants see top-down prep-level
percentage labels (-7.5/+25/+37.5) that the v2 engine doesn't honor — needs a
template-semantics decision; Edit Prices doesn't write version history (Change the
Price does); maxUsers unenforced (no add-user flow exists to enforce it on).

Per the constitution this sweep found criticals, so the two-clean-sweeps counter is
still at ZERO. Next iteration: sweep #2.

### Iteration 24 — Full-app Critic sweep #2 — FINDINGS → fixed → green
Second completion-check sweep. **Security lens: PASS, zero critical/high** — adversarially
re-verified every iter-23 fix holds (logo traversal, PDF IDOR, upload magic-bytes, email
escape, tenant isolation, OAuth state, webhook signature, rate limits). **Correctness lens:
zero critical/high, all 11 iter-23 fixes verified holding with no regressions, 93 tests** —
one MODERATE: snapshot endpoint missed the PDF-only guard that generate/regenerate got
(fixed: `&& output_format !== 'pdf'`). **Marcos lens: 2 HIGH on the homepage** — these block:
the homepage still sold email + Google Docs/Sheets as universal (they're GQ Pro) with no
labeling, and re-floated "track who accepted and who ghosted" (no open/view tracking exists;
status is manual). Both were copy I'd written before the tier split fully landed. Fixed: every
Pro capability on the homepage now carries a "GQ Pro" tag and PDF/branding is stated as the
base-tier truth; tracking copy reduced to the real manual Won/Lost win-rate. Plus moderates:
demo pipeline "Viewed" chip removed (implied auto view-tracking) → Draft→Sent→Won/Lost; GQ
"Send to Client" button now shows "Download PDF to send" + the send page server-load redirects
GQ users (no composing into a 402); pricing/profile/client-edit number-entry grids made
`grid-cols-1 sm:grid-cols-N` (phone number entry); Sheets recap "other" label aligned to
PDF/Docs ("Setup & surcharges" / "Adjustments & discounts").

Sweep found HIGHs → **two-clean-sweeps counter stays at ZERO.** Next: sweep #3 must come back
fully clean, then sweep #4 clean, to pass the completion check.

### Iteration 25 — Full-app Critic sweep #3 — FINDINGS → fixed → green
**Correctness lens: CLEAN** (zero critical/high; verified all sweep-2 edits hold; only a
pre-existing LOW output_format type-cast + a NIT Infinity-guard, both fixed anyway).
**Security lens: 1 HIGH + 1 LOW** — HIGH: onboarding/+page.server.ts serialized the raw
google_refresh_token (a long-lived OAuth credential) into the browser's SSR payload; it
only ever needed a boolean. Now `googleConnected: !!token`; verified no other server load
leaks it. LOW: update handler's declined-branch re-read wasn't tenant-scoped (no data
crossed — attacker's OAuth client can't touch a victim folder — but fixed for consistency).
**Marcos lens: 2 HIGH** — both were TWINS of sweep-2 fixes that landed on one surface but
not its pair: (1) docs/tracking still showed the "Viewed" open-tracking pill + "reserved for
read tracking" copy (demo got fixed, docs didn't) → removed, pipeline now Draft→Sent→Won/Lost;
(2) the dashboard-LIST "Send" button still linked GQ users into the send page that redirects
them right back (detail-page button got fixed, list didn't). Fixing the list surfaced a real
pre-existing gap: GQ users send manually so estimates stay 'draft', but Won/Lost only showed
for sent/viewed — GQ users could never record an outcome. Restructured BOTH the detail-page
primary-action block and the list quick-actions so Won/Lost is available from any open status
on every plan, while emailing stays Pro. Plus moderates: docs/output now Pro-badges Google
Docs/Sheets and clarifies English snapshots are base / other languages Pro (caught my own
near-miss: don't badge the whole snapshot feature Pro — English is included); onboarding
wage/anchor grids stack on phones; dashboard Pro-tease reworded to the genuinely-Pro thing
(win rate + averages by trade, not "see your numbers" sitting under visible numbers); readout
grids responsive; register page restates the 14-day no-card trial.

**Process lesson (logged):** when a fix removes a claim or gates a feature, grep for EVERY
surface that makes the same claim — the twin (demo↔docs, detail-page↔list) is where it hides.
Sweep #3 found two HIGHs that were purely un-twinned sweep-2 fixes.

Sweep found HIGHs → **counter stays at 0/2.** Next: sweep #4 must come back fully clean.

### Iteration 26 — Full-app Critic sweep #4 — ALL THREE LENSES CLEAN ✓ (first of two)
**Security: CLEAN** — zero critical/high; full tenant-isolation re-audit clean; verified the
sweep-3 token-leak fix and every prior fix holds; only 2 informational NITs (email-builder
name interpolation, rate-limit proxy note). **Correctness: CLEAN** — zero critical/high, 93
tests; all sweep-3 edits verified, the new "Won/Lost from draft" path confirmed consistent
(no sent_at column exists; win-rate counts any non-draft as sent). **Marcos/truth: CLEAN** —
zero critical/high/moderate; no false promises, no reverse-vapor, no contradictions, no dead
ends, no brand violations, no 390px breakage; cross-surface consistency spot-checks all pass
(14-day trial, English-snapshot-base/other-langs-Pro, branding-base-on-gq all agree
front-to-back); one NIT (dead `viewed` status string in label maps — unreachable, no code
writes it).

Closed the NITs anyway as cheap hardening: guarded the price-adjust pct against a 0 base
(Infinity% display); routed all email-builder name/company interpolation through an HTML
escape helper (defense in depth — values are tenant/Google-profile data, rendered in a mail
client, never reflected into the app, so not exploitable, but now clean). 93 tests, build ✓.

**COMPLETION CHECK: clean sweep 1 of 2.** Sweep #5 must also come back fully clean to satisfy
the constitution's two-consecutive-clean requirement, then the GAN overhaul is complete
(only LR-2 deploy, gated on Ryan's banking, would remain).

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
- [x] D-8 RULED (iter 12 Critic): KEEP — dashboard Copy mirrors the pre-existing
  ungated detail-page action; duplication copies an already-priced quote (no
  disabled-trade pricing path runs); trades are reversible. Cosmetic caveat logged:
  a disabled-trade draft has no matching filter chip (visible under "All").
