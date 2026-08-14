# ClickDee Backend

Hono + `@hono/zod-openapi` API, documented with Swagger UI, backed by PostgreSQL via Prisma.

## Setup

From the repo root (this is a pnpm workspace):

```
pnpm install
```

Copy `.env.example` to `.env` in `backend/` and set `DATABASE_URL` to a reachable Postgres connection string (a local Prisma Postgres dev server works: `npx prisma dev --detach`, then use the direct `postgres://...` connection string it prints).

Apply migrations:

```
pnpm --filter backend prisma:migrate
```

## Run

```
pnpm --filter backend dev
```

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- Raw OpenAPI spec: `http://localhost:3000/openapi.json`

## Other scripts

```
pnpm --filter backend lint
pnpm --filter backend format
pnpm --filter backend test
pnpm --filter backend build
pnpm --filter backend prisma:studio
```
