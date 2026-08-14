# syntax=docker/dockerfile:1
#
# Single-container image for Northflank: nginx serves the built frontend
# (frontend/dist) and reverse-proxies /api, /openapi.json, /docs to the
# Hono backend (backend/dist), which runs as a second process in the
# same container. See docker/entrypoint.sh and docker/nginx.conf.
#
# Northflank service port: 8080 (nginx). The backend listens internally
# on 3000 and is not reachable directly from outside the container.
#
# Required runtime env var: DATABASE_URL (plain postgres://... connection
# string — @prisma/adapter-pg cannot use prisma+postgres://).
# Optional: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, AZURE_OPENAI_DEPLOYMENT.
#
# This image does NOT run Prisma migrations on startup. Run
# `pnpm --filter backend exec prisma migrate deploy` as a separate
# Northflank job/one-off run against the target database.

ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=10.18.1

FROM node:${NODE_VERSION} AS base
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---- full workspace deps (dev + prod), used by both build stages ----
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --no-frozen-lockfile

# ---- backend: prisma generate + tsc build ----
FROM deps AS backend-build
COPY backend backend
ARG DATABASE_URL=postgresql://user:password@localhost:5432/db
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm --filter backend prisma:generate
RUN pnpm --filter backend build

# ---- backend: production-only node_modules ----
FROM base AS backend-prod-deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --no-frozen-lockfile --prod --filter backend

# ---- frontend: vite build (API calls made relative to page origin) ----
FROM deps AS frontend-build
COPY frontend frontend
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter frontend build

# ---- runtime: nginx + node, both processes in one container ----
FROM node:${NODE_VERSION} AS runtime
RUN apk add --no-cache nginx tini
WORKDIR /app

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-prod-deps /app/node_modules ./node_modules
COPY --from=backend-prod-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 8080

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/entrypoint.sh"]
