# GuildQuote — UI Walkthrough Audit

> **How to use:** Walk through each screen in order. For each one, open it in the browser, compare what you see against the checklist, and note your feedback in the "Notes" column. Mark each ✅ (good), ⚠️ (needs work), or ❌ (broken/missing). When done, we'll batch-fix everything you flagged.
>
> Run the app with `npm run dev` and start at the top.

---

## Flow 1: First Impression (Cold Traffic)

### 1.1 Landing Page — `/`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Hero headline is clear and compelling | | |
| 2 | Value prop communicates "close more jobs" (not "save time") | | |
| 3 | CTA buttons are obvious (Try Demo / Start Free Trial) | | |
| 4 | Feature overview section exists | | |
| 5 | Pricing is visible or linked | | |
| 6 | Social proof / credibility signals present | | |
| 7 | Footer with legal links (Terms, Privacy) | | |
| 8 | Page looks professional on desktop | | |
| 9 | Page looks acceptable on mobile (resize browser to ~375px) | | |
| 10 | Load time feels fast | | |

### 1.2 Demo Page — `/demo`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Header/nav is clean, "Start Free Trial" CTA visible | | |
| 2 | Trade selector is intuitive (interior/exterior/epoxy) | | |
| 3 | Scope form fields make sense, nothing confusing | | |
| 4 | Form validation — try submitting empty, do errors show? | | |
| 5 | Loading state while generating estimate | | |
| 6 | Result: price display is prominent and clear | | |
| 7 | Result: production hours show as range (not point value) | | |
| 8 | "What happens next" pipeline mockup is compelling | | |
| 9 | Feature cards below result are clear | | |
| 10 | Email capture CTA at bottom works | | |
| 11 | Overall: does this page make you want to sign up? | | |

### 1.3 Upgrade/Pricing Page — `/upgrade`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Tier names match vault plan (GQ / GQ Pro) | | |
| 2 | Prices match vault plan ($49/mo / $149/mo) | | |
| 3 | Feature lists are accurate and compelling | | |
| 4 | Annual pricing option shown (2 months free) | | |
| 5 | CTA buttons work (or will wire to Stripe) | | |
| 6 | Page doesn't feel salesy or cluttered | | |
| 7 | FAQ section answers real objections | | |

---

## Flow 2: Registration & Onboarding

### 2.1 Registration — `/auth/register`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Form fields are minimal (company, name, email) | | |
| 2 | Google OAuth button prominent | | |
| 3 | Field validation works (try bad email, empty fields) | | |
| 4 | Error messages are helpful, not technical | | |
| 5 | Success state / redirect is smooth | | |
| 6 | ToS acceptance checkbox present | | |
| 7 | Link to Terms and Privacy Policy visible | | |
| 8 | Overall: could a non-technical contractor complete this in 30 seconds? | | |

### 2.2 Login — `/auth/login`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Clean, simple layout | | |
| 2 | Google OAuth button works | | |
| 3 | Magic link flow works (enter email → check inbox) | | |
| 4 | Error state if email not found | | |
| 5 | Link to register if no account | | |

### 2.3 Onboarding — `/onboarding`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Step indicator shows progress (1/2/3) | | |
| 2 | **Step 1 (Trades):** Trade checkboxes are clear | | |
| 3 | Trade descriptions help contractor pick correctly | | |
| 4 | **Step 2 (Pricing):** Dual-mode toggle makes sense | | |
| 5 | "I know my costs" mode: metro selector works, wage auto-fills | | |
| 6 | "I know my costs" mode: live preview updates correctly | | |
| 7 | "I know my prices" mode: anchor inputs are intuitive | | |
| 8 | Skip button is available but not too prominent | | |
| 9 | **Step 3 (Google Connect):** Purpose is clear | | |
| 10 | Connect button works (or skip works) | | |
| 11 | Overall: could a contractor finish onboarding in 2 minutes? | | |

---

## Flow 3: Core Product Loop (Create → View → Send)

### 3.1 Dashboard — `/dashboard`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | **Empty state** (no estimates): messaging is helpful, CTA to create | | |
| 2 | **With estimates**: table is scannable (client, trade, total, status, date) | | |
| 3 | Status badges are distinct and meaningful | | |
| 4 | Action banners (drafts not sent, awaiting response) are useful | | |
| 5 | Analytics cards show correct data | | |
| 6 | Self-benchmarking section (if 10+ estimates) is clear | | |
| 7 | "New Estimate" button is prominent | | |
| 8 | Filtering/sorting works | | |
| 9 | Sidebar navigation is intuitive | | |
| 10 | Pro upsell banner is tasteful, not annoying | | |
| 11 | Overall: does the dashboard feel like a professional tool? | | |

### 3.2 New Estimate — `/dashboard/new`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Client info fields (name, email, phone, address) are clear | | |
| 2 | Trade selection (if multi-trade enabled) works | | |
| 3 | **Interior scope form**: room builder is intuitive | | |
| 4 | Adding/removing rooms works smoothly | | |
| 5 | Item selection within rooms makes sense (walls, ceiling, trim, doors, windows) | | |
| 6 | Condition selectors (surface grade, prep level) are understandable | | |
| 7 | **Exterior scope form**: surface builder is intuitive | | |
| 8 | **Epoxy scope form**: floor builder is intuitive | | |
| 9 | Form validation — try submitting incomplete scope | | |
| 10 | Loading state during generation | | |
| 11 | Result: price display is clear | | |
| 12 | Result: production hours show as range | | |
| 13 | Overall: could a contractor scope a 5-room interior in under 3 minutes? | | |

### 3.3 Estimate Detail — `/dashboard/[id]`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Header: client name, address, trade, status badge | | |
| 2 | Price display is prominent | | |
| 3 | **Document links**: PDF and/or Google Doc links visible | | |
| 4 | If document links are missing — is there an error message or retry button? | | |
| 5 | **Quick Actions** section: regenerate, duplicate, delete, archive | | |
| 6 | **Client editing**: inline edit for name/email/phone/address | | |
| 7 | **Pricing editing**: toggle edit mode, change line items, recalculate | | |
| 8 | **Price adjustment**: override total, see line items scale | | |
| 9 | **Status tracking**: mark accepted (with close price) or declined (with reason) | | |
| 10 | **Sub estimate** (if sub mode on): shows per-section sub costs | | |
| 11 | **Scope breakdown**: sections, items, quantities, condition grades visible | | |
| 12 | **Surcharges**: trash, transportation, CC fee visible and correct | | |
| 13 | **Materials**: products, quantities, costs listed | | |
| 14 | **Production**: hours range, crew size, duration displayed | | |
| 15 | LOSP section present (or correctly hidden if disabled) | | |
| 16 | Previous versions accessible (if estimate was regenerated) | | |
| 17 | Overall: does this page give the contractor everything they need? | | |

### 3.4 Send to Client — `/dashboard/[id]/send`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Summary visible (client, address, total, trade) | | |
| 2 | Recipient email pre-filled from client info | | |
| 3 | Subject line is professional | | |
| 4 | Message body is pre-filled with good default copy | | |
| 5 | Attachment toggles (PDF, Google Doc link) work | | |
| 6 | Send button works | | |
| 7 | Success confirmation is clear | | |
| 8 | Overall: would you feel confident sending this to a homeowner? | | |

---

## Flow 4: Settings & Configuration

### 4.1 Profile Settings — `/dashboard/settings/profile`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Logo upload works (upload, preview, replace, remove) | | |
| 2 | Company info fields are all editable | | |
| 3 | Brand color pickers work, preview shows actual usage | | |
| 4 | Save feedback (success toast or confirmation) | | |
| 5 | Overall: does this feel professional? | | |

### 4.2 Pricing Settings — `/dashboard/settings/pricing`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | **Labor & Margins tab**: pricing mode toggle clear | | |
| 2 | Metro selector works, auto-fills wage | | |
| 3 | Crew wage, size, margin inputs work | | |
| 4 | Live preview (billing rate, sample price, keep-per-$1000) updates | | |
| 5 | Sub mode toggle and margin input work | | |
| 6 | **Surcharges tab**: all toggles and amounts editable | | |
| 7 | **Materials tab**: product catalog editable | | |
| 8 | **Payment Terms tab**: deposit %, thresholds editable | | |
| 9 | LOSP toggle present and working | | |
| 10 | Output format selector (Docs vs Sheets) works | | |
| 11 | Save feedback on each tab | | |
| 12 | Overall: is this too dense? What would you simplify? | | |

### 4.3 Catalog Editor — `/dashboard/settings/catalog`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Room types and sizes are listed correctly | | |
| 2 | Price fields are editable | | |
| 3 | Modifiers tab works | | |
| 4 | Save feedback | | |
| 5 | Overall: is this useful or overwhelming? | | |

### 4.4 Billing — `/dashboard/settings/billing`
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Current plan displayed correctly | | |
| 2 | Trial status / days remaining shown | | |
| 3 | Upgrade buttons work (or placeholder) | | |
| 4 | Referral code visible with copy button | | |
| 5 | Overall: is billing status clear at a glance? | | |

---

## Flow 5: Edge Cases & Error States

### 5.1 Error Pages
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Navigate to `/dashboard/nonexistent-id` — 404 page shows | | |
| 2 | 404 page is branded, has "back to dashboard" link | | |
| 3 | Error page doesn't expose technical details | | |

### 5.2 Empty & Loading States
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Dashboard with 0 estimates — helpful empty state | | |
| 2 | Estimate generation — loading spinner visible | | |
| 3 | Any slow API call — does UI show loading? | | |
| 4 | Filter with no results — "no matches" message | | |

### 5.3 Legal Pages
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | `/terms` loads and has content | | |
| 2 | `/privacy` loads and has content | | |
| 3 | Footer links to both from every page | | |

---

## Flow 6: Output Quality (The Money Check)

> This is the most important section. The entire value prop is "professional estimates that sell." Open a generated estimate in each output format and evaluate.

### 6.1 PDF Output
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Contractor branding (logo, colors, company name) present | | |
| 2 | Client info correct | | |
| 3 | Scope breakdown is clear and detailed | | |
| 4 | Production hours show as range | | |
| 5 | LOSP / surface grade section looks professional | | |
| 6 | Pricing recap table is aligned and readable | | |
| 7 | Payment terms section present | | |
| 8 | No text overflow, cut-off, or alignment issues | | |
| 9 | Page breaks are sensible | | |
| 10 | Overall: would you send this to a $15K client? | | |

### 6.2 Google Docs Output
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Document opens in contractor's Google Drive | | |
| 2 | Branding and formatting are professional | | |
| 3 | Scope breakdown matches PDF content | | |
| 4 | Production hours show as range (not point value) | | |
| 5 | Document is editable (contractor can tweak before sending) | | |
| 6 | Overall: does this look like a premium output? | | |

### 6.3 Google Sheets Output
| # | Check | ✅/⚠️/❌ | Notes |
|---|-------|----------|-------|
| 1 | Sheet opens in contractor's Google Drive | | |
| 2 | Column widths and formatting are clean | | |
| 3 | Data is organized logically | | |
| 4 | Formulas work (if any) | | |
| 5 | Overall: is this a useful working document? | | |

---

## Scoring Summary

After completing the audit, tally your marks:

| Flow | ✅ Count | ⚠️ Count | ❌ Count | Priority Notes |
|------|---------|---------|---------|----------------|
| 1. First Impression | | | | |
| 2. Registration & Onboarding | | | | |
| 3. Core Product Loop | | | | |
| 4. Settings | | | | |
| 5. Edge Cases & Errors | | | | |
| 6. Output Quality | | | | |
| **TOTAL** | | | | |

**Rule of thumb:**
- ❌ items = fix before any beta user sees it
- ⚠️ items = fix before public launch (June 1)
- ✅ items = leave alone

Paste your completed audit back and we'll batch-fix everything.
