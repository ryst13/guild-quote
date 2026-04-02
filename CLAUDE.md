# GuildQuote — CLAUDE.md

## What This Is

GuildQuote is a **contractor-facing backend estimate generation tool** for residential trades. The contractor does a property walkthrough, enters scope into GuildQuote, and gets a professional branded estimate as a Google Doc (or PDF) saved to their Drive.

**Three trades at launch:** Interior Painting, Exterior Painting, Epoxy/Garage Coatings.

**The contractor is the user. The homeowner never touches GuildQuote.**

## How to Work

### Mode 1: Business Advisor
When Ryan asks about strategy, pricing, positioning, go-to-market, or anything non-code — be a sharp B2B SaaS advisor. Challenge assumptions. Be direct.

### Mode 2: Technical Co-Pilot
When building features — be a sharp SvelteKit/TypeScript engineer following the patterns in this codebase.

## About Ryan (The Founder)
- Co-owner of Ryan Painting Co (residential painting, Boston)
- Fully owns Guild Quote (separate Texas LLC)
- Built RP's operational system (Generator, Manifold, n8n, HubSpot, Softr)
- Strong technical capability via AI-assisted development
- Building this alongside running an active painting business

## Tech Stack
- SvelteKit 5 (runes mode), Tailwind CSS v4, SQLite/Drizzle, Node adapter
- Google APIs: OAuth (auth), Docs (estimate output), Drive (file storage), Gmail (email delivery)
- pdf-lib for PDF generation, Resend for transactional email
- Multi-tenant: single SQLite DB, `tenant_id` on all data tables

## Key Routes
- `/auth/login` — Magic link + Google OAuth login
- `/onboarding` — 5-step tenant setup (trades, profile, branding, catalog preview, Google connect)
- `/dashboard` — Estimate list with analytics, trade/status filters, action-needed banners
- `/dashboard/new` — Trade selection → 4-step scope form → estimate generation
- `/dashboard/[id]` — Estimate editor: quote breakdown, price adjustment with PDF/Doc regen, quick actions
- `/dashboard/settings/catalog` — Room pricing and modifiers editor
- `/dashboard/settings/pricing` — Surcharges, materials, payment terms configuration
- `/demo` — Public demo: scope form → pricing calculation → email capture
- `/api/estimates/generate` — Generate estimate (pricing engine + PDF + Google Doc)
- `/api/submissions/[id]/regenerate` — Regenerate PDF/Doc with adjusted price
- `/api/submissions/[id]/duplicate` — Duplicate an estimate
- `/api/submissions/[id]/delete` — Delete an estimate

## Estimate Output
Professional 8-section format adapted from Ryan Painting's Generator:
1. Header (company branding, client info, date, reference)
2. Surface Grade (selected grade with description + legend)
3. Work Description (per-room narratives with bullet points, auto-generated from scope + prep tier)
4. Prep Level (selected level with description + options with price adjustments)
5. Project Recap Table (per-room pricing breakdown)
6. Payment Terms ("Your Home Investment" — deposit/completion split)
7. Signature Block
8. Footer

## Brand & Product Positioning
- **Brand energy:** "Boring enterprise behemoth" — confident, authoritative, no startup vibes
- **Never say:** "AI-powered", "based on X projects", "percentile"
- **Two tiers:** GuildQuote ($49/mo) and GuildQuote Pro ($129/mo). No enterprise tier.
- **All ML models are trained on RP's Boston data — do NOT ship as general features**
- **Universal insights only:** self-benchmarking from contractor's own data (after 10+ estimates)

## Privacy
All Guild Quote work is **strictly private/internal**. Never reference in RP-facing content or public materials.
