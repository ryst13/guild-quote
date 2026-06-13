# ── GuildQuote production image ───────────────────────────────────────────
# SvelteKit (adapter-node) + better-sqlite3 + Litestream-backed SQLite.
# Multi-stage: build with full toolchain, ship a slim runtime.

# 1) Build stage — full deps + native toolchain for better-sqlite3
FROM node:22-bookworm-slim AS build
WORKDIR /app

# better-sqlite3 compiles a native addon if no prebuild matches the platform
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev

# 2) Runtime stage — slim image, no compilers, + the Litestream binary
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

# Litestream — streams the SQLite DB to object storage continuously
ARG LITESTREAM_VERSION=0.3.13
RUN wget -q https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.deb \
  && dpkg -i litestream-v${LITESTREAM_VERSION}-linux-amd64.deb \
  && rm litestream-v${LITESTREAM_VERSION}-linux-amd64.deb

# App artifacts: the built server, production node_modules, and package.json
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Deploy support files
COPY deploy/litestream.yml /etc/litestream.yml
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# The Fly volume mounts here — DB, logos, and PDFs all live on it.
# (The app writes ./data relative to WORKDIR, so this is /app/data.)
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["/app/start.sh"]
