# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
RUN npm install --global corepack@0.31.0 && corepack enable && corepack prepare pnpm@10.4.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
# Mantém as devDependencies (drizzle-kit, tsx) para poder rodar, dentro do
# próprio container, as mesmas ferramentas de migration/validação que já
# existem no repositório (pnpm db:migrate, deploy:preflight, etc.).
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile && pnpm store prune
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY scripts ./scripts

EXPOSE 3000
CMD ["node", "dist/index.js"]
