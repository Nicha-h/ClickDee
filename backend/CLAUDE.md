# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This backend has a layered structure (routes/services/schemas/middleware/db/config) built around one worked example, the `Campaign` resource — a minimal CRUD vertical slice (list/get/create) meant to be the reference pattern for new resources. There's no auth yet, and only one domain model exists in Prisma. Extend the existing conventions rather than inventing new ones.

## Monorepo layout

`clickdee` (repo root) is a pnpm workspace (`pnpm-workspace.yaml`) with two packages: `frontend/` (a built-out Vite + React app — has its own `frontend/CLAUDE.md`) and `backend/` (this directory). Root `package.json` scripts (`dev`, `build`) delegate to both packages via `pnpm --filter`.

## Stack

- **Runtime/language:** TypeScript on Node.js
- **Web framework:** Hono (`hono` + `@hono/node-server`), with `@hono/zod-openapi` for route definitions validated by Zod and auto-generated OpenAPI docs, and `@hono/swagger-ui` serving interactive docs at `/docs`
- **ORM/DB:** Prisma (`prisma-client` generator, the no-Rust-engine TS client) targeting PostgreSQL through a driver adapter (`@prisma/adapter-pg` + `pg`). Prisma client generates into `src/generated/prisma` (gitignored)
- **Validation/tooling:** Zod, ESLint (flat config, mirrors `frontend/eslint.config.js` but with `globals.node`), Prettier (`semi: false`, `singleQuote: true`, same as frontend), Vitest
- **Package manager:** pnpm (workspace-level)
- **Dev runner:** `tsx` (loaded via `node --import tsx`), restarts on save via Node's native `--watch` (see note below on why `tsx watch` itself isn't used)

## Commands

Run via `pnpm --filter backend <script>` from repo root, or directly from `backend/`:

- `dev` — `node --watch --import tsx src/server.ts`, serves on `http://localhost:3000`, Swagger UI at `/docs`, spec at `/openapi.json`
- `build` / `start` — `tsc -b` then `node dist/server.js`
- `lint`, `format`, `format:check`
- `test`, `test:watch` — Vitest, tests colocated as `*.test.ts` next to source
- `prisma:generate`, `prisma:migrate`, `prisma:studio`

Install deps: `pnpm install` from the repo root (workspace-aware).

## Architecture

- `src/app.ts` builds and exports a side-effect-free `OpenAPIHono` app (routes mounted, `app.doc()`, Swagger UI, error handlers) — importable directly in tests via `app.request(...)` without binding a port.
- `src/server.ts` is the only place that calls `serve()`; it's the process entrypoint.
- No `controllers/` layer: `createRoute` + its handler stay colocated in `src/routes/<resource>.ts` (matching Hono's idiomatic style), but handlers delegate immediately to `src/services/<resource>.service.ts`, which owns all Prisma access. Routes never import `prisma` directly.
- `src/schemas/<resource>.schema.ts` holds the Zod shapes shared between the route's OpenAPI request/response schemas and the service's input types.
- `src/db/client.ts` exports a `globalThis`-cached `PrismaClient` singleton (avoids connection leaks across dev-mode restarts), constructed with a `PrismaPg` driver adapter (`@prisma/adapter-pg`) — **required** in Prisma 7's `prisma-client` generator; there is no Rust query engine binary anymore, so the client must be given either a driver `adapter` or an `accelerateUrl` at construction time, it can't read `DATABASE_URL` implicitly.
- `src/config/env.ts` parses `process.env` through Zod (`NODE_ENV`, `PORT`, `DATABASE_URL`) and fails fast on misconfiguration.
- `src/middleware/error-handler.ts` registers `app.notFound` and `app.onError` — call once from `app.ts` after routes are mounted.
- `prisma/schema.prisma`: `generator client { provider = "prisma-client" }` (no Rust engine) + one model, `Campaign`. The datasource block intentionally has **no `url`** — Prisma 7 forbids putting the connection string in the schema; `prisma.config.ts` supplies it to the CLI, and `src/db/client.ts` supplies it to the runtime adapter, both from `DATABASE_URL`.
- `tsconfig.json`: strict mode, ESNext/NodeNext modules, JSX configured for `hono/jsx`, output to `dist/`, excludes `**/*.test.ts` from the build (tests aren't shipped).

### DATABASE_URL: use a plain `postgres://` connection string, not `prisma+postgres://`

`@prisma/adapter-pg` connects over the raw Postgres wire protocol via `pg` — it **cannot** talk to Prisma's own `prisma+postgres://` proxy scheme (that's a different, HTTP-based protocol meant for Prisma Accelerate/managed Prisma Postgres, and the connection just hangs/terminates if you hand it here). If using the local Prisma Postgres dev server (`npx prisma dev --detach`), use the **direct** connection string it prints (`postgres://postgres:postgres@localhost:<port>/template1?sslmode=disable`, one port above the main port it's listening on) as `DATABASE_URL`, not the `prisma+postgres://...` one. Both the CLI (via `prisma.config.ts`) and the app (via `src/db/client.ts`'s adapter) read the same `DATABASE_URL`. In a real deployment, `DATABASE_URL` is just whatever standard Postgres connection string the provider gives you — this local-dev two-protocol quirk goes away entirely.

### Why `dev` uses `node --watch --import tsx` instead of `tsx watch`

`tsx watch` is the more common choice and works fine when you run `pnpm --filter backend dev` directly. But on this project's Windows dev environment, `tsx watch`'s own child-process-based restart mechanism never completes when it's invoked through an extra layer of process wrapping — specifically when run via the root `pnpm dev` (which uses `concurrently` to run frontend and backend together): the process starts but silently never binds the port. `node --watch --import tsx` doesn't have this problem (Node's built-in watch restarts the process natively rather than spawning a child over IPC) and works reliably both standalone and under `concurrently`. `src/server.ts` registers `SIGINT`/`SIGTERM` handlers that call `server.close()` before exiting, so the port is released cleanly on restart. If this turns out to be specific to one machine/Node version rather than a general Windows issue, `tsx watch` is a reasonable thing to revisit.

## Product context

Based on the sibling `frontend/` app's pages, ClickDee is an ad-campaign management/analytics platform: users connect ad accounts (e.g. Facebook), create and manage campaigns, and view AI-assisted performance reports. The `Campaign` model/routes are the first real slice of that; ad accounts, reporting, and auth are still unbuilt.
