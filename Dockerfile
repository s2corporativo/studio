# syntax=docker/dockerfile:1

# ---- base -------------------------------------------------------------
# corepack 0.31.0 is pinned to avoid a known signature-verification bug in
# newer corepack releases when activating pnpm on node:22-bookworm-slim.
FROM node:22-bookworm-slim AS base
RUN npm install -g corepack@0.31.0 && corepack enable
WORKDIR /app

# ---- deps (all dependencies, used for build + migrations) -------------
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# ---- build (compiles client + server bundle) ---------------------------
FROM deps AS build
COPY . .
RUN pnpm build

# ---- prod-deps (production-only node_modules for the runtime image) ---
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml .npmrc* ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# ---- runtime -------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --no-create-home --shell /usr/sbin/nologin studio \
  && chown -R studio:nodejs /app
USER studio
EXPOSE 3000
CMD ["node", "dist/index.js"]
