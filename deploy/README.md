# GuildQuote — Production Deploy Runbook (LR-2)

Single Fly.io machine running SvelteKit (adapter-node) + SQLite, with Litestream
streaming the database to object storage. **One instance only** — SQLite is a
single-writer database; never scale past one machine.

What lives where on the persistent volume (`/app/data`):
- `guildquote.db` — the database (backed up by Litestream)
- `logos/` — tenant logo uploads (survive restarts on the volume; not in Litestream)
- `pdfs/` — generated estimate PDFs (regenerable from the DB)

---

## Prerequisites (Ryan — the LR-2 "your move" items)

1. **Entity + business bank account** for GuildQuote LLC.
2. **Stripe** in live mode, identity/business verified, bank connected.
3. **Domain** `guildquote.com` (or chosen domain) under your control.
4. **Google Cloud** OAuth client (Web), with the production redirect URI added,
   and the consent screen submitted for verification (basic scopes: Drive +
   Docs — no restricted scope, so this is the lighter review).
5. **Resend** account with the sending domain verified (SPF/DKIM/DMARC records).
6. **Fly.io** account + `flyctl` installed (`brew install flyctl` / scoop).

---

## One-time setup

### 1. Create the app + volume
```sh
fly auth login
fly apps create guildquote                 # or: fly launch --no-deploy (uses fly.toml)
fly volumes create guildquote_data --region bos --size 3   # 3 GB
```

### 2. Create the backup bucket (Fly Tigris shown; B2/S3 work too)
```sh
fly storage create                          # creates a Tigris bucket + keys
# Note the bucket name + AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY it prints.
```

### 3. Set secrets (everything sensitive — NOT in fly.toml)
```sh
fly secrets set \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  SMTP_PASS="<resend-api-key>" \
  SMTP_USER="resend" \
  SMTP_HOST="smtp.resend.com" \
  SMTP_PORT="587" \
  SMTP_SENDER="estimates@guildquote.com" \
  SMTP_FROM="GuildQuote <estimates@guildquote.com>" \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  STRIPE_PRICE_GQ_MONTHLY="price_..." \
  STRIPE_PRICE_PRO_MONTHLY="price_..." \
  LITESTREAM_REPLICA_URL="s3://<bucket>/db" \
  LITESTREAM_ACCESS_KEY_ID="<tigris-key-id>" \
  LITESTREAM_SECRET_ACCESS_KEY="<tigris-secret>" \
  AWS_ENDPOINT_URL_S3="https://fly.storage.tigris.dev"
```
(Non-secret config — ORIGIN, BASE_URL, PORT, DATABASE_URL, BODY_SIZE_LIMIT — is
already in `fly.toml [env]`. Adjust the domain there if not guildquote.com.)

### 4. Stripe products + webhook
- In the Stripe dashboard (live mode) create two recurring products:
  **GQ $49/mo** and **GQ Pro $129/mo**. Copy each Price ID into the secrets above.
- Add a webhook endpoint → `https://guildquote.com/api/billing/webhook`,
  subscribe to: `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`.
  Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

### 5. Deploy
```sh
fly deploy
```

### 6. Domain
```sh
fly certs add guildquote.com
fly certs add www.guildquote.com
# Add the A/AAAA (or CNAME) records Fly prints to your DNS.
```

---

## Smoke test (do this before announcing)
1. `https://guildquote.com/healthz` → `{"ok":true}`.
2. Register a real trial account → confirm the welcome email arrives (Resend).
3. Connect Google → confirm no "unverified app" wall (verification done).
4. Create an estimate → PDF downloads; on a Pro/trial account a Google Doc appears in Drive.
5. Send an estimate to yourself → arrives from your domain, reply-to is the contractor email.
6. Run a **test card** through the $49 and $129 checkouts → confirm the webhook
   flips the plan correctly (watch `fly logs`).
7. Mark an estimate Won, then Lost → confirm status + (if Google connected) the
   Drive folder move.

## Backups — verify they work
```sh
fly ssh console -C "litestream snapshots ${DATABASE_URL}"   # should list snapshots
```
Disaster recovery is automatic: a fresh machine restores the latest snapshot on
boot (see `deploy/start.sh`). To restore manually:
```sh
litestream restore -o /app/data/guildquote.db s3://<bucket>/db
```

## Day-2 notes
- **Never** set `min_machines_running > 1` or add a second machine — SQLite is
  single-writer. Vertical scaling (bigger `[[vm]]`) is fine.
- Deploys cause ~a few seconds of downtime (single machine). Acceptable at launch.
- Logos live only on the volume. If you later want them backed up too, add a
  periodic `aws s3 sync /app/data/logos` or move uploads to object storage.
- Watch `fly logs` after deploy; `[start]` lines show Litestream restore/replicate.
