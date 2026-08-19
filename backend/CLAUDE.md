# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This backend has a layered structure (routes/services/schemas/middleware/db/config). `Campaign` is a full CRUD vertical slice (list/get/create/update/delete), `userId`-owned and behind `requireAuth` like every other resource — it used to be the unauthenticated reference slice before auth existed everywhere, that's no longer the case. It also has a `caption` field (nullable text) alongside name/status/budget/dates.

Auth: httpOnly session cookies protect every `User`-owned resource (`/api/auth/account/:id`, `/api/ai/*`, `/api/ai-memory/*`, `/api/campaigns/*`, `/api/notifications/*`). See **Auth** below before adding a new authenticated route. Domain models in Prisma: `User` with `Campaign`, `Conversation`/`Message` (AI chat history), `AiMemory` (encrypted onboarding follow-up answers), `PendingAiAction` (staged AI-proposed campaign mutations awaiting human confirmation), and `Notification` all cascade-linked to it. See **AI campaign actions (human-in-the-loop)** under Product context for how the latter two fit together. Extend existing conventions rather than inventing new ones.

## Monorepo layout

`clickdee` (repo root) is a pnpm workspace (`pnpm-workspace.yaml`) with two packages: `frontend/` (a built-out Vite + React app — has its own `frontend/CLAUDE.md`) and `backend/` (this directory). Root `package.json` scripts (`dev`, `build`) delegate to both packages via `pnpm --filter`.

## Stack

- **Runtime/language:** TypeScript on Node.js
- **Web framework:** Hono (`hono` + `@hono/node-server`), with `@hono/zod-openapi` for route definitions validated by Zod and auto-generated OpenAPI docs, and `@hono/swagger-ui` serving interactive docs at `/docs`
- **ORM/DB:** Prisma (`prisma-client` generator, the no-Rust-engine TS client) targeting PostgreSQL through a driver adapter (`@prisma/adapter-pg` + `pg`). Prisma client generates into `src/generated/prisma` (gitignored)
- **Validation/tooling:** Zod, ESLint (flat config, mirrors `frontend/eslint.config.js` but with `globals.node`), Prettier (`semi: false`, `singleQuote: true`, same as frontend), Vitest
- **Auth:** `jose` (HS256 JWT sign/verify — see **Auth** below)
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
- `src/config/env.ts` parses `process.env` through Zod (`NODE_ENV`, `PORT`, `DATABASE_URL`, `AUTH_JWT_SECRET`, `AI_MEMORY_ENCRYPTION_KEY`, plus the optional `AZURE_OPENAI_*` trio) and fails fast on misconfiguration. `AUTH_JWT_SECRET` (≥32 chars) and `AI_MEMORY_ENCRYPTION_KEY` (base64, decodes to exactly 32 bytes) are **required**, unlike the Azure OpenAI vars — generate each with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (secret) / `.toString('base64')` (key). See `.env.example`.
- `src/middleware/error-handler.ts` registers `app.notFound` and `app.onError` — call once from `app.ts` after routes are mounted.
- `src/middleware/auth.ts` exports `requireAuth` (a Hono middleware) and `AuthVariables` (the `{ userId: string }` context type). `src/lib/auth.ts` exports `signSessionToken`/`verifySessionToken` (JWT). See **Auth** below.
- `src/lib/encryption.ts` exports `encryptField`/`decryptField` (AES-256-GCM) for sensitive Prisma text columns. See **Sensitive data** below.
- `src/middleware/rate-limit.ts` exports a `rateLimit({ windowMs, max })` factory — an in-memory, per-IP, single-instance limiter. See **Rate limiting** below.
- `prisma/schema.prisma`: `generator client { provider = "prisma-client" }` (no Rust engine). The datasource block intentionally has **no `url`** — Prisma 7 forbids putting the connection string in the schema; `prisma.config.ts` supplies it to the CLI, and `src/db/client.ts` supplies it to the runtime adapter, both from `DATABASE_URL`.
- `tsconfig.json`: strict mode, ESNext/NodeNext modules, JSX configured for `hono/jsx`, output to `dist/`, excludes `**/*.test.ts` from the build (tests aren't shipped).

## Auth

httpOnly session cookies, not bearer tokens. `POST /api/auth/signup` and `POST /api/auth/login` sign a JWT (HS256, 24h expiry, `AUTH_JWT_SECRET`) and set it via `Set-Cookie: session=<token>; HttpOnly; SameSite=Lax` (see `lib/cookie.ts`'s `setSessionCookie`/`clearSessionCookie`) — the response body no longer includes the token. The browser attaches the cookie automatically on same-site requests; CORS is configured with `credentials: true` to allow this across the dev `localhost:5173` → `localhost:3000` port split. `POST /api/auth/logout` (`requireAuth`) clears the cookie server-side — there's no client-side token to simply drop anymore.

`requireAuth` (`middleware/auth.ts`) reads the `session` cookie via `hono/cookie`'s `getCookie`, not an `Authorization` header. It also enforces a lightweight CSRF check: any `POST`/`PUT`/`PATCH`/`DELETE` request through it must carry `X-Requested-With: XMLHttpRequest`, or it 403s — `SameSite=Lax` already blocks the cookie on most cross-site requests, this closes the remaining simple-cross-site-form gap without a double-submit token. `GET`/`HEAD` are exempt.

To protect a new route:
1. Type the app as `new OpenAPIHono<{ Variables: AuthVariables }>()` (see `routes/auth.ts` / `routes/ai.ts`).
2. Add `middleware: [requireAuth] as const` to the route's `createRoute({...})` config — `@hono/zod-openapi` infers the handler's context type from this, so `c.get('userId')` is typed without extra casts.
3. In the handler, read the caller's identity from `c.get('userId')` — **never** trust a client-supplied `userId` in the body/query/params for anything auth already tells you.
4. If the route also takes a resource id in the URL (e.g. `/account/:id`), `requireAuth` only proves *who* the caller is — it does not check they own `:id`. Add an explicit `if (c.get('userId') !== id) return c.json({ message: 'Forbidden' }, 403)` (see `getAccountRoute`/`deleteAccountRoute` in `routes/auth.ts`), or — the pattern used for `Campaign`/`AiMemory` — scope the resource query itself by `userId` so "not found" and "not yours" collapse into the same 404 without an extra existence-leaking check.

`Campaign` is behind `requireAuth` and scoped per-owner (`Campaign.userId`), same as `AiMemory`/`Conversation`. It was the plain-CRUD reference slice before auth existed; that's no longer the case, so don't treat it as the unauthenticated example anymore.

## Sensitive data

`AiMemory.question` and `AiMemory.answer` are both encrypted at rest with AES-256-GCM (`lib/encryption.ts`, key from `AI_MEMORY_ENCRYPTION_KEY`) — encrypt immediately before the Prisma write, decrypt only where actually needed (`getAiMemoryQas`/`getAiMemoryItems` in `services/onboarding.service.ts`, used by the AI chat context and the account-page AI Memory viewer respectively). `question` used to be left in plaintext (it's the AI's own generated prompt text, not user-typed input) but is now encrypted too for defense-in-depth, since it's dynamically generated per business context and could hint at business specifics in aggregate. Follow this same pattern (encrypt at the service layer, right before the write) for any new column holding user-authored business/PII content.

Full Postgres row-level security (RLS) and transparent data encryption (TDE) at the database layer are a deliberately separate, larger future initiative — not part of this field-level encryption. TDE is a setting on the Postgres hosting provider, not application code. RLS would need a non-superuser app DB role, policy migrations, and per-request session-variable middleware; don't attempt it as a side effect of a "should this field be encrypted" change.

**PII redaction of AI chat input** (`lib/pii-filter.ts`'s `redactPii`) is a separate, complementary mechanism to the encryption above — it doesn't encrypt-then-decrypt, it strips sensitive spans out of the text entirely before the text exists anywhere else. `ai.service.ts`'s `sendMessage` calls it as the very first line, before the user's message is written to `Message.content` or included in the history sent to Azure OpenAI, so redacted content never reaches either the DB or the third-party model. It's a best-effort regex pipeline (email, phone, IPv4/IPv6, Luhn-checked card numbers, long bank-account-like digit runs, Thai/English address keywords, "my name is"/"ชื่อ...คือ" name patterns) — not NER-grade, and known to miss bare real names outside those trigger phrases. This is a deliberate, documented v1 scope decision (see PDPA notes below), not an oversight to silently "improve" with a model-based second pass without discussing the added latency/cost/Azure-dependency tradeoff first. Scope is strictly the user's free-text chat prompt — never applied to an AI-proposed campaign `caption`, which may legitimately contain a real business phone number. `Message.redacted` (boolean) records whether a given message was altered, surfaced to the frontend so the user sees a visible notice rather than silently having their input rewritten (PDPA Sec 23 transparency).

## Rate limiting

`middleware/rate-limit.ts`'s limiter keeps its counters in an in-memory `Map` — it works correctly for a single process but does **not** coordinate across multiple instances. It's applied to `POST /api/onboarding/followup-question` because that route is unauthenticated (see below) and spends real Azure OpenAI budget per call. This is intentional tech debt, deliberately left as-is while the app runs as a single backend process — the trigger condition to revisit it is any horizontal scale-out (multiple instances behind a load balancer, serverless scale-to-many, etc.), at which point it must move to a shared store (Redis or similar) or per-instance limits become trivially bypassable by spreading requests across instances. Don't treat the in-memory implementation as an oversight to "fix" before that trigger condition is actually met.

`POST /api/onboarding/followup-question` is the one intentionally public, unauthenticated endpoint in the API: it runs during onboarding, before an account/token exists, and only proxies to the AI (no DB write), so it carries no PII-at-rest risk. It's guarded by the rate limiter plus request size caps instead of `requireAuth`.

### DATABASE_URL: use a plain `postgres://` connection string, not `prisma+postgres://`

`@prisma/adapter-pg` connects over the raw Postgres wire protocol via `pg` — it **cannot** talk to Prisma's own `prisma+postgres://` proxy scheme (that's a different, HTTP-based protocol meant for Prisma Accelerate/managed Prisma Postgres, and the connection just hangs/terminates if you hand it here). If using the local Prisma Postgres dev server (`npx prisma dev --detach`), use the **direct** connection string it prints (`postgres://postgres:postgres@localhost:<port>/template1?sslmode=disable`, one port above the main port it's listening on) as `DATABASE_URL`, not the `prisma+postgres://...` one. Both the CLI (via `prisma.config.ts`) and the app (via `src/db/client.ts`'s adapter) read the same `DATABASE_URL`. In a real deployment, `DATABASE_URL` is just whatever standard Postgres connection string the provider gives you — this local-dev two-protocol quirk goes away entirely.

### Why `dev` uses `node --watch --import tsx` instead of `tsx watch`

`tsx watch` is the more common choice and works fine when you run `pnpm --filter backend dev` directly. But on this project's Windows dev environment, `tsx watch`'s own child-process-based restart mechanism never completes when it's invoked through an extra layer of process wrapping — specifically when run via the root `pnpm dev` (which uses `concurrently` to run frontend and backend together): the process starts but silently never binds the port. `node --watch --import tsx` doesn't have this problem (Node's built-in watch restarts the process natively rather than spawning a child over IPC) and works reliably both standalone and under `concurrently`. `src/server.ts` registers `SIGINT`/`SIGTERM` handlers that call `server.close()` before exiting, so the port is released cleanly on restart. If this turns out to be specific to one machine/Node version rather than a general Windows issue, `tsx watch` is a reasonable thing to revisit.

## Deployment

`Dockerfile` builds both packages into a single image; `docker/entrypoint.sh` starts the backend (`node .../server.js`) and nginx as sibling background processes, then `wait`s on the backend specifically. If the backend exits (e.g. crashes at boot on a missing env var), the entrypoint kills nginx and exits with the backend's code, so the container as a whole is reported unhealthy/failed instead of nginx staying up and silently 502-ing every `/api/*` request forever.

## Product context

Based on the sibling `frontend/` app's pages, ClickDee is an ad-campaign management/analytics platform: users connect ad accounts (e.g. Facebook), create and manage campaigns, and view AI-assisted performance reports. The `Campaign` model/routes are the first real slice of that; ad accounts and reporting are still unbuilt. Onboarding now has a real AI-driven follow-up loop (`routes/onboarding.ts` + `services/onboarding-ai.service.ts`): after the user fills in base business info, the AI asks up to `MAX_FOLLOWUP_QUESTIONS` (5) clarifying questions one at a time — capped server-side and fail-safe on any AI/parse error — and the answers are persisted as `AiMemory` at signup, only if the user explicitly consented. The system prompt also treats a vague/non-answer (e.g. "ไม่ทราบ", "ไม่แน่ใจ", "idk") as insufficient to finish the flow — the model is instructed to ask a different, more concrete question (narrower scope, concrete example) instead of repeating the same abstract one or ending early. Beyond the prompt instruction, `generateFollowupQuestion` now backs that up with a programmatic character-bigram similarity check against previously-asked questions (Thai text doesn't reliably space-delimit words, so this is bigram-based rather than word-overlap) — a likely-repeat or a parse/schema-validation failure triggers exactly one retry (with an extra corrective note appended to the prompt) before falling back to `done:true`, and every fail-safe path now logs via `console.error` so premature endings are debuggable. Follow-up questions can also be multiple-choice now (`FollowupResult`/`FollowupQuestionResponseSchema`'s `type: 'text' | 'choice'` + `choices: string[] | null`), when the model judges the answer space is a small fixed set.

AI chat (`routes/ai.ts` + `services/ai.service.ts`) replies may now span multiple chat bubbles: the model is instructed to separate distinct points with a line containing exactly `[[NEXT]]`, which `sendMessage` splits and persists as one `Message` row per bubble (sequential, not `Promise.all`, so `createdAt` ordering stays deterministic) — `POST /api/ai/messages` returns `assistantMessages: AiMessage[]` (plural) instead of a single message. Markdown tables are now allowed in replies (previously forbidden in the prompt). The assistant uses OpenAI SDK native function-calling (`onboarding-ai.service.ts` instead uses `response_format: json_object` for its own JSON output — that distinction still holds).

### AI campaign actions (human-in-the-loop)

The assistant has three tools — `stage_create_campaign`, `stage_update_campaign`, `stage_delete_campaign` — and **none of them mutate `Campaign` directly**. `ai.service.ts`'s `executeToolCall` only calls `pending-ai-action.service.ts`'s `stagePendingAction`, which writes a `PendingAiAction` row (`type`, `targetCampaignId`, a Zod-validated `payload` JSON blob, `status: PENDING`) and returns a tool result telling the model the action is staged-only. The model's follow-up reply is instructed to state the proposal in plain language (name/budget/schedule/caption for create/update) and ask the user to confirm — it must never claim the action already happened. This is the actual security boundary for "AI can't act on its own": there is no code path from a tool call to a Prisma `campaign.create/update/delete` call, only through the confirm endpoint below, which requires the authenticated session user to explicitly invoke it. None of the three tool JSON schemas expose a `status`/`publish` field either, so the model can never request `ACTIVE` even under prompt injection — `payload.proposedStatus` is always hardcoded to `'DRAFT'` server-side when staging.

`POST /api/ai/actions/:id/confirm` (body `{publish: boolean}`, default `false`) is the only code path that executes the staged action — `pending-ai-action.service.ts`'s `confirmPendingAction` atomically claims the row first (`updateMany({where: {..., status: 'PENDING'}})`, checking `count`) before touching `Campaign`, closing a confirm/cancel race window. `publish: true` is the only way a `CREATE` action's campaign ends up `ACTIVE` instead of `DRAFT`, or an `UPDATE` action's target gets `status: 'ACTIVE'` — that decision belongs solely to the human clicking confirm, never the model. `POST /api/ai/actions/:id/cancel` (`cancelPendingAction`) uses the same atomic-claim pattern to move `PENDING → CANCELED`. A `PendingAiAction` past a 24h TTL is opportunistically flipped to `EXPIRED` inside `stagePendingAction`'s own cap check (max 5 concurrent `PENDING` per user) rather than via a cron job — there's no job scheduler in this codebase, same category of deliberate tech debt as the in-memory rate limiter above.

`Notification` (`routes/notifications.ts` + `services/notification.service.ts`) is a real backend model now, not frontend-only mock data. `sendMessage` creates one (`type: 'AI_TASK'`) whenever a tool call stages an action; its `link` is `null` for a `CREATE` (no campaign exists yet) until `confirmPendingAction` fills it in as `/campaign/:id` once the campaign is actually created — the frontend's notification bell polls `GET /api/notifications` (no websocket/SSE in this codebase) and uses that `link` for click-to-navigate. A `Message` can carry a `pendingActionId` (the **last** bubble of a staging turn) so `GET /api/ai/messages` returns the confirm-card data inline with the chat history, no second round-trip needed.
