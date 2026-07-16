# Backend service — NestJS + Prisma. Multi-stage: build with full deps, run lean.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Build toolchain for native modules (argon2) + openssl for Prisma's engine
# detection (its binary target depends on the OpenSSL version).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*

# Install deps (postinstall runs `prisma generate`, which needs the schema, so
# copy the source first).
COPY package.json package-lock.json ./
COPY . .
RUN npm ci
RUN npm run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma needs openssl present at runtime to load the correct query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Prisma schema + migrations (path pinned in package.json `prisma.schema`).
COPY --from=builder /app/src/infrastructure/persistence/prisma ./src/infrastructure/persistence/prisma

EXPOSE 3000
# Apply migrations, then start. Seed once (optional) with:
#   docker compose ... exec backend node dist/infrastructure/persistence/prisma/seed.js
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
