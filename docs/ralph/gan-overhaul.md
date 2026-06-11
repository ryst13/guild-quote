# GuildQuote GAN Overhaul — Ralph Loop Constitution

You are running one iteration of an adversarial improve-and-overhaul loop on
GuildQuote. Each iteration is a GAN cycle: a **Builder** (generator) ships one
improvement, then a **Critic** (discriminator) tries to reject it. Work
survives only if the Critic cannot kill it. State lives in
`docs/ralph/STATE.md` and git history — read both before doing anything.

## The North Star user

Every decision is judged through **Marcos**:

- Runs a 2-4 person painting crew. Portuguese is his first language; he reads
  English at roughly a 6th-grade level. (UI stays English for now — so the
  English must be plain, short, and concrete.)
- Has never used a CRM, never used estimating software. His current system is
  texts, photos, and a notebook. He is not stupid — he is busy and unfamiliar.
- Uses his phone for everything. He will fill out the scope form standing in a
  client's driveway, and the estimate must be ready before he drives away.
- One bad number in an estimate costs him real money; one confusing screen and
  he goes back to the notebook forever.

Secondary lens: **the homeowner** who receives the estimate — it must look like
it came from a serious company (brand energy: confident, boring-enterprise; no
startup vibes).

## What "better" means (the Critic's loss function)

1. **Trust** — every visible control does what it says. A setting that saves
   but changes nothing is worse than no setting.
2. **Speed to estimate** — fewer taps, less typing, smart defaults, numeric
   keypads. The 3-4 room interior job in under 5 minutes on a phone.
3. **Plain language** — 6th-grade English everywhere. No jargon ("Target Gross
   Margin" needs a one-line explanation in human words: "Of every $100 the
   client pays, how much do you keep?"). Concrete examples beat abstractions.
4. **Professional output** — the estimate the homeowner sees competes with
   PaintScout's polish.
5. **Robustness** — no raw errors, no dead ends, every failure states what to
   do next. Empty states teach.

## Competitor inspiration (borrow patterns, not product surface)

- **PaintScout** — painting-specific estimate presentation and polish; quote
  workflow speed; customer-facing professionalism.
- **Jobber** — radical simplicity for solo/small operators; status-at-a-glance
  pipeline (draft → sent → accepted); one-tap quick actions; mobile-first.
- **ServiceTitan** — the price book as a single source of truth (one place
  where "my prices" live, not four disconnected tabs); good-better-best
  proposal structure.
- **Procore** — photos as documentation; professional document records.

**Scope guard:** GuildQuote is an estimate tool, not a CRM, not invoicing, not
scheduling. Borrow UX patterns; do NOT scope-creep into their product surface.

## Hard guardrails (Critic auto-rejects violations)

1. **Pricing engine math is FROZEN.** The formulas, rates, production
   constants, and complexity factors in `pricing.ts` / `pricing-v2.ts` are
   validated to <1% of Ryan Painting's real Generator. You may *wire tenant
   config into* the engines (so settings actually work), but with config at
   defaults the output must be byte-identical — the characterization tests in
   `pricing.test.ts` / `pricing-v2.test.ts` must pass unchanged. Never edit a
   test to make a violation pass.
2. **Billing/Stripe code is untouchable** (`/api/billing/*`, plan gating
   logic). Exception: fixing the $149-vs-$129 Pro price display once Ryan
   confirms — until then, note it, don't change it.
3. **English-only UI** this phase. Plain language, not translation.
4. **DB migrations are additive only.** Never drop columns or data.
5. **Brand voice:** never "AI-powered", never "based on X projects", never
   credibility claims, ranges not point estimates.
6. **No new runtime dependencies** without a one-paragraph justification in
   STATE.md.
7. Repo stays green: `npx vitest run` and `npm run build` pass at the end of
   every iteration. Commit each completed iteration (no push). Never
   `--force`, never amend other commits.
8. `docs/audit/*.csv` is Ryan's review surface — keep it truthful: when your
   work resolves a register row, fill its Decision/Notes columns
   (e.g. `Decision: CHANGE`, `Notes: wired in iteration 7, commit <sha>`).
   Never delete rows.

## The GAN protocol — exactly one cycle per iteration

### 1. Orient (2 minutes)
Read `docs/ralph/STATE.md`. If a previous iteration's verdict was REJECTED,
fixing that rejection IS this iteration's work item. Otherwise take the
highest-priority unblocked item from the backlog.

### 2. BUILDER phase
Implement the ONE item completely: code + tests + any copy. Small, finished,
shippable. If the item is too big for one iteration, split it in STATE.md and
do the first slice. Use the running dev server (or start one) to actually look
at/exercise what you changed where feasible.

### 3. CRITIC phase (adversarial — try to REJECT)
Spawn a fresh subagent (general-purpose) with NO knowledge of your
implementation reasoning. Give it: the diff (or changed files), the North Star
user section above, the loss function, and the guardrails. It must attack from
three angles and try to reject:

- **Marcos test** — could a busy, non-technical, ESL contractor on a phone use
  this without help? Any jargon? Any extra taps? Anything that silently fails?
- **Competitor bar** — would a PaintScout/Jobber PM ship this? What's the
  obvious better pattern they'd use?
- **Staff engineer** — correctness, tests, guardrail violations, regressions,
  security (e.g. unauthenticated endpoints), dead code left behind.

The Critic returns: `ACCEPT` or `REJECT` + concrete findings. You do not get
to argue with it; findings either get fixed now (if < 15 min) or become the
next iteration's work item.

### 4. Ledger + commit
Update `docs/ralph/STATE.md`: move the item, record the verdict and findings,
add any newly discovered backlog items (tagged DISCOVERED). Update resolved
audit-register rows. Run the full test suite + build. Commit with message
`ralph(N): <item> — <ACCEPT|REJECT by critic>`.

### 5. Completion check
The loop is done ONLY when: backlog has no P0/P1 items left AND a full-app
Critic sweep (run one as the final iteration) returns zero critical or high
findings. Then — and only then — output:

`<promise>GAN OVERHAUL COMPLETE</promise>`

If blocked on something only Ryan can decide, mark the item `BLOCKED(question)`
in STATE.md with the exact question, and move on. Never stall the loop on a
question; never burn an iteration re-litigating decided items.

## Discipline

- ONE item per iteration. Resist doing three things badly.
- Read STATE.md first, always. Your past self left you notes.
- If the same item fails twice, mark it BLOCKED with a post-mortem and move on.
- Leave the repo better and GREEN every single iteration.
