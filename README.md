---
title: "README"
type: reference
area: admin
status: active
created: 2026-03-25
updated: 2026-03-25
tags:
  - drive-import
  - admin
---

# Smart Quote Pro

Multi-tenant SaaS platform that lets painting contractors offer self-service online quoting to their customers.

## Architecture

### Tech Stack
- **Frontend:** SvelteKit 5 (runes mode) with Tailwind CSS v4
- **Database:** SQLite via Drizzle ORM
- **PDF:** pdf-lib (server-side generation)
- **Email:** Nodemailer (configurable SMTP)
- **Auth:** Magic link (passwordless)
- **Hosting:** Node.js adapter, self-hostable

### Multi-Tenancy
Single database with `tenant_id` column on all data tables. Each contractor is a tenant with their own:
- Company profile, branding (colors, logo)
- Pricing catalog (room types, sizes, surface prices, modifiers)
- Stage pipeline configuration
- Quote wizard at `/{slug}/quote`

### Database Schema
- **tenants** — Company profile, branding, catalog JSON, stages, thresholds
- **users** — Email, name, role (contractor_admin, contractor_staff, homeowner), tenant_id
- **sessions / magic_links** — Passwordless auth
- **submissions** — Quote submissions with form data, rooms, calculated quote, stage, crew assignment

### Project Structure
```
smart-quote-pro/
├── src/
│   ├── routes/
│   │   ├── (marketing)/        # Landing page, features, pricing, demo, for-painters
│   │   ├── (auth)/auth/        # Login, register, verify
│   │   ├── onboarding/         # 4-step contractor setup wizard
│   │   ├── dashboard/          # Contractor dashboard + detail view
│   │   │   ├── settings/catalog/  # Pricing catalog editor
│   │   │   └── [id]/           # Submission detail + actions
│   │   ├── client/             # Homeowner portal
│   │   ├── [slug]/quote/       # Embeddable quote wizard
│   │   └── api/                # REST endpoints
│   ├── lib/
│   │   ├── server/             # DB, pricing, PDF, email, auth, tenants
│   │   ├── components/         # IntakeWizard (5-step form)
│   │   ├── stores/             # Svelte stores
│   │   └── types/              # TypeScript types
│   └── app.html
├── config/defaults/            # Default catalog, stages, thresholds
├── data/                       # SQLite DB + PDFs (runtime, gitignored)
└── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- npm

### Install & Run
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `./data/smart-quote-pro.db` |
| `BASE_URL` | Public URL for links/emails | `http://localhost:5173` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | (none — emails logged to console) |
| `SMTP_PASS` | SMTP password | (none) |
| `SMTP_FROM` | From address | auto |
| `MAGIC_LINK_EXPIRY_MINUTES` | Magic link TTL | `15` |
| `NODE_ENV` | Environment | `development` |

**Note:** Without SMTP credentials, emails are logged to the console (dev mode).

## User Flows

### Contractor Registration
1. Sign up with company name + email
2. Session created automatically (no email verification needed)
3. Onboarding wizard: Company Profile → Branding → Pricing → Embed Code
4. Dashboard accessible immediately

### Quote Submission (Homeowner)
1. Visit `/{contractor-slug}/quote`
2. 5-step wizard: Welcome → Contact → Rooms → Details → Review
3. Submit → pricing calculated from contractor's catalog
4. Instant on-screen quote with room breakdown
5. PDF generated and emailed
6. Submission appears in contractor's dashboard

### Contractor Dashboard
- View all submissions sorted by date
- Click into detail view for room-by-room breakdown
- Adjust quote amount, add notes
- Approve quote, assign crew, set date
- Advance project through stages
- Send status update emails to clients

### Client Portal
- Magic link login for homeowners
- View project status with visual stage progress bar
- Download estimate PDF
- See assigned crew and scheduled dates

## Deployment

### Self-hosted (Node.js)
```bash
npm run build
node build/index.js
```

The app uses SQLite — no external database required. Data stored in `./data/`.

### Environment
Set `NODE_ENV=production` and `BASE_URL` to your domain for:
- Secure cookies
- Correct magic link URLs
- Correct embed code URLs

## Pricing Engine

Catalog-driven pricing with:
- **Room type × size** base prices (11 room types × 3 sizes)
- **Surface selections:** walls, ceiling, trim, doors, windows, crown molding, shelving, cabinets
- **Modifiers:** ceiling height (1.0x/1.15x/1.3x), condition (needs_work = +20%)
- **Special conditions:** wallpaper removal ($350/room), dark-to-light (+15%), textured (+10%), wood stain (+20%)
- **Project adders:** furniture handling ($0/$50/$75 per room)

All prices configurable per-tenant through the catalog editor.

## Multi-Tenancy

Each contractor tenant gets:
- Unique slug URL (`/{slug}/quote`)
- Custom branding (colors applied to wizard, PDF, emails)
- Independent pricing catalog
- Isolated submissions (tenant_id scoping on all queries)
- Own dashboard accessible at `/dashboard`
