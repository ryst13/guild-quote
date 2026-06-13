#!/bin/sh
# ── GuildQuote container entrypoint ────────────────────────────────────────
# 1. If the volume has no DB (fresh machine / volume loss), restore the latest
#    snapshot from object storage so we never start with an empty database.
# 2. Hand off to Litestream, which runs the Node server as its subprocess and
#    streams every change to the replica in real time.
set -e

DB_PATH="${DATABASE_URL:-/app/data/guildquote.db}"

# Only attempt a restore when a replica is configured AND the DB is missing.
if [ -n "$LITESTREAM_REPLICA_URL" ] && [ ! -f "$DB_PATH" ]; then
  echo "[start] No local DB found — restoring from replica…"
  litestream restore -if-replica-exists -o "$DB_PATH" "$DB_PATH" || \
    echo "[start] No replica to restore (first ever boot) — starting fresh."
fi

if [ -n "$LITESTREAM_REPLICA_URL" ]; then
  echo "[start] Starting under Litestream replication."
  exec litestream replicate -exec "node build"
else
  # No backup configured (e.g. local prod test) — run the server directly.
  echo "[start] LITESTREAM_REPLICA_URL unset — running without replication."
  exec node build
fi
