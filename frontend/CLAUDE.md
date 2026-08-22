# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a React + TypeScript + Vite app with Tailwind CSS v4. Routing is `react-router-dom` v7 (see `src/App.tsx` for the full route table — signup/login, a multi-step onboarding flow, and an authenticated dashboard layout). Backend calls go through an orval-generated OpenAPI client (`src/api/generated/client.ts`) — see **API client & auth** below. There is still no state management library and no test runner. This section was originally written when the app was an early scaffold; the note about `src/pages/home.tsx`/`src/components/navbar.tsx` being empty shells is no longer true — verify against the actual code rather than this doc for anything not covered by a specific note below.

Package manager is **pnpm** (see `packageManager` in package.json — use pnpm, not npm/yarn).

## Commands

```sh
pnpm dev       # start Vite dev server
pnpm build     # tsc -b (project-references type check) then vite build
pnpm lint      # eslint .
pnpm preview   # preview the production build
```

There is no test script configured. There is no single-file/single-test invocation since no test runner is present.

## Architecture

- Vite + `@vitejs/plugin-react` for React fast refresh.
- Tailwind CSS v4 via `@tailwindcss/vite` plugin (not the PostCSS-config approach from v3) — global styles/entry point is `src/index.css` (`@import "tailwindcss";`). `@tailwindcss/postcss` is also a dependency; if a `postcss.config` shows up, check it isn't duplicating the Vite plugin.
- Entry point: `src/main.tsx` mounts `App` from `src/App.tsx` into `#root` (defined in `index.html`).
- `src/pages/` holds page-level components, `src/components/` holds shared/reusable components. Existing files (`home.tsx`, `navbar.tsx`) use lowercase function names and default exports — follow that pattern unless asked to change it, since it's the only convention established so far.
- `orval` generates the API client from the backend's OpenAPI spec — see **API client & auth** below.
- TypeScript project uses solution-style config: `tsconfig.json` references `tsconfig.app.json` (app code, `src/`) and `tsconfig.node.json` (Vite config). `tsconfig.app.json` has `noUnusedLocals`/`noUnusedParameters`/`verbatimModuleSyntax` enabled — unused imports/vars and non-type-only type imports will fail the build.
- ESLint flat config (`eslint.config.js`) extends `js.configs.recommended`, `typescript-eslint` recommended, `eslint-plugin-react-hooks` recommended, and `eslint-plugin-react-refresh` (Vite variant). `dist` is ignored.

## API client & auth

- `orval.config.ts` generates `src/api/generated/client.ts` from the backend's live OpenAPI spec (`pnpm generate:api`, requires the backend dev server running on `http://localhost:3000`) — **do not hand-edit** the generated file. Every generated function takes an optional trailing `options?: RequestInit`, which is how per-call options get attached (see below); there is no orval `mutator` configured.
- Auth is an httpOnly, `SameSite=Lax` session cookie set by the backend on `postApiAuthSignup`/`postApiAuthLogin` — there is no token in JS to store. `src/lib/userId.ts` exports `withCredentials()` (`{ credentials: 'include', headers: { 'X-Requested-With': 'XMLHttpRequest' } }`); pass it as the trailing `options` argument on **every** call to an auth-protected endpoint (and on login/signup itself, since a credentialed cross-origin request needs `credentials: 'include'` to accept the `Set-Cookie` response), e.g. `getApiAuthAccountId(id, withCredentials())` or `postApiAiMessages({ text }, withCredentials())`. The `X-Requested-With` header is required by the backend's `requireAuth` CSRF check on mutating requests — sending it on GETs too is harmless, so it's baked into the one helper rather than varied per method. This is the established pattern for attaching auth; a global orval mutator was deliberately not used (would require guessing at its exact fetch-client contract for a "minimal auth" scope) — keep following the per-call pattern rather than introducing a mutator later without a reason.
- `src/lib/userId.ts` also keeps `getUserId`/`setUserId`/`clearUserId` (`localStorage`) as a lightweight "am I logged in" signal for UI branching — it is **not** the security boundary (the cookie + backend `requireAuth` is); don't treat its presence as proof of a valid session.
- Logout is a server round-trip now (`postApiAuthLogout(withCredentials())`) since there's no client-side token to simply drop — it clears the cookie server-side. Always call it before `clearUserId()` (see `setting.tsx`'s `logout()`). Account deletion follows the same shape: `deleteApiAuthAccountId(...)` clears the cookie server-side too, then `clearUserId()` locally.

## Design system & Figma integration

No design-tokens package, Storybook, or component library exists yet — everything below is inferred directly from `src/`. Treat this as the current state, not a target architecture; update it as the app grows.

### Token definitions

All design tokens live in **`src/index.css`**, defined CSS-first via Tailwind v4's `@theme` block (not a JS/JSON tokens file, no Style Dictionary or similar transform pipeline):

```css
@theme {
  --font-eng: 'Plus Jakarta Sans', sans-serif;
  --font-thai: 'Kanit', sans-serif;
  --color-amalfi: #1e59bc;
  --color-amalfihover: #1b50a9;
  --color-amalfiactive: #184796;
  --color-citrus: #fed717;
  --color-sea: #77baff;
  --color-btnactive: #a481f9;
  /* ...plus -light/-dark/-hover/-active variants per hue, see file */
}
```

- Three brand color families — `amalfi` (blue), `citrus` (yellow), `sea` (light blue) — each with a `-light`, base, `hover`, `active`, `dark`, `dark-hover`, `dark-active`, `darker` ladder. When a Figma color doesn't map onto one of these, ask before inventing a new one-off hex value inline.
- Two font families for a bilingual (Thai/English) product: `font-eng` (Plus Jakarta Sans) for Latin text, `font-thai` (Kanit) for Thai text, loaded via Google Fonts `@import` at the top of `index.css`. Apply the matching `font-eng`/`font-thai` class to the language actually being rendered.
- No spacing, radius, or shadow tokens are defined — those fall back to Tailwind's default scale, and arbitrary values (`rounded-[19px]`, `shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30`, `text-[#8E98A8]`) already appear in the codebase where a Figma value didn't line up with a Tailwind default. Match this pattern (arbitrary value classes) rather than adding new `@theme` entries for one-off values pulled from a single design.
- When a Figma file exposes variables/styles, prefer mapping them onto the existing `@theme` tokens over hardcoding hex/px values in components.

### Component library

- `src/components/` — shared/reusable components (`navbar.tsx`, `Topbar.tsx`, `notificationPanel.tsx`). File casing is inconsistent (`Topbar.tsx` vs `navbar.tsx`); match whichever a sibling file already does rather than establishing a new casing.
- `src/pages/` — route-level components. Coverage is uneven: `home.tsx`, `setting.tsx`, `ai.tsx`, and the `onboarding*.tsx` pages are fully built; don't assume any other page still matches the old "empty shell" (`export default function x() { return <div></div> }`) placeholder pattern without checking — verify the specific file rather than assuming either way.
- No component library dependency (no shadcn/ui, Radix, MUI, etc.) and no Storybook — components are hand-built with Tailwind utility classes directly in JSX.
- No variant system (no `class-variance-authority`/`cva`, no `clsx`/`tailwind-merge`) — conditional styling is done with plain template-literal ternaries reading local `useState`, e.g. in `navbar.tsx`:
  ```tsx
  className={`... ${activeButton === 'home' ? 'bg-citrus-light' : 'bg-amalfi'} ...`}
  ```
  Follow this pattern for now rather than introducing `cva`/`clsx` unasked. Note `react-router-dom`'s `NavLink` already supports an `isActive` render-prop pattern that would replace the manual `activeButton` state — worth flagging if refactoring, not silently changing.
- Default exports, one component per file, matching the file's base name.
- Onboarding has two distinct step patterns — pick the matching one when extending it, don't blend them: `onboardingWizard.tsx` renders a **fixed, known-in-advance** `OnboardingStepConfig[]` (used for the base business-info steps, `data/onboarding.ts`). `onboardingAiFollowup.tsx` instead drives a loop of **AI-generated, one-at-a-time** questions (`pages/onboardingProcessing.tsx` fetches the first via `postApiOnboardingFollowupQuestion`, then the component fetches each next one after an answer is submitted) — the step count isn't known upfront, only capped (`MAX_FOLLOWUP_QUESTIONS = 5`, mirrored from the backend's own hard cap; the backend cap is authoritative, the frontend one is just so the UI doesn't wait on a network round-trip it already knows will be refused). It also gates on an explicit consent checkbox before collecting anything — see `docs`/`backend/CLAUDE.md`'s **Sensitive data** section for where those answers end up. While the next question is being fetched, `onboardingAiFollowup.tsx` swaps the question header for a breathing/spinning "AI กำลังคิดคำถามถัดไป..." indicator rather than leaving stale copy on screen. `onboardingProcessing.tsx`'s fetch for the first question distinguishes a request `AbortError` (component unmounted/navigated away — fail silently) from an actual network/HTTP failure (logs via `console.error` before falling back to `{ done: true, question: null }`), so real failures aren't swallowed silently. A follow-up question now carries a `type: 'text' | 'choice'` (plus `choices` when it's `'choice'`) — `onboardingAiFollowup.tsx` renders `choice` questions with `OnboardingChoiceCard` (the same component `onboardingWizard.tsx` uses) plus a generic "อื่นๆ (พิมพ์เอง)" option that reveals a free-text fallback input, mirroring `onboardingWizard.tsx`'s own `selectedOtherChoice`/`otherText` pattern; selecting an option does not auto-advance, matching the text-answer flow (the user still confirms via "ถัดไป" or Enter).
- `pages/ai.tsx` synthesizes a local (non-persisted) greeting `ChatMessage` when `GET /api/ai/messages` returns no history — regenerated fresh each time, not a summary of anything. A single AI turn can now render as **multiple chat bubbles**: `postApiAiMessages` returns `assistantMessages: AiMessage[]` (plural — the backend may split a reply into more than one bubble), and `handleSend` spreads all of them into `messages`. `markdownComponents` now also styles headings, inline/block code, blockquotes, links, and GFM tables (wrapped in `overflow-x-auto`).
- The AI chat assistant proposes campaign create/update/delete via backend tool-calling but never executes anything itself — see `backend/CLAUDE.md`'s **AI campaign actions (human-in-the-loop)** section for the full server-side staging design. On the frontend, `ChatMessage` carries an optional `pendingAction` (mirrors the API's `AiMessage.pendingAction`) — when present and `status === 'PENDING'`, `AiBubble` renders a `PendingActionCard` **below** the normal markdown reply (not instead of it — the model's prose still explains the proposal in words; the card is the actionable confirm/cancel UI). The card shows a name/budget/schedule/caption summary (via `pendingActionSummary`, extracted to `src/lib/pendingAction.ts` since `pages/campaignReview.tsx` now needs the same payload→rows mapping — see below), a "publish now vs save as draft" checkbox that **defaults to draft (unchecked)**, and Confirm/Cancel buttons calling `postApiAiActionsIdConfirm`/`postApiAiActionsIdCancel` — each button click has its own local `isResolving` spinner state, independent of the page-level `isSending`/`TypingBubble` used for the main chat request. On resolution, `handlePendingActionResolved` in the `Ai` component patches that message's `pendingAction.status` in local state (not a refetch), which swaps the card for `PendingActionResolvedBadge` (a "✓ confirmed, view campaign" link once `targetCampaignId` is set, or a plain "canceled"/"expired" line). A message's `redacted: boolean` (see backend's PII-redaction note) drives a small inline warning under `UserBubble` when the user's own text was altered before being stored — this is a UI concern of transparency, not moderation; the message still sends normally.
- `Topbar.tsx` + `notificationPanel.tsx` fetch real data from `GET /api/notifications` now (previously 100% hardcoded mock array — that's gone). `Topbar.tsx` fetches once on mount and then polls every 20s (`POLL_INTERVAL_MS`) — there's no websocket/SSE in this codebase, so polling is the whole "real-time-ish" mechanism; the initial fetch is written as an inline `.then()` chain rather than calling the polling helper function directly inside the `useEffect` body, specifically to satisfy `react-hooks/set-state-in-effect` (calling a named async function that itself calls a `useState` setter directly in an effect body trips that lint rule; an inline `.then()` callback doesn't, matching the pre-existing pattern in `pages/ai.tsx`'s message-history fetch — follow the same shape for any other polled/fetched-on-mount state). Clicking a notification (`onItemClick`) marks it read and `navigate()`s to `notification.link` when present (e.g. `/campaign/:id` once an AI-proposed campaign is confirmed); `notificationPanel.tsx` renders a hover-revealed (`opacity-0 group-hover:opacity-100`) cancel `X` button per row, shown only when `pendingActionStatus === 'PENDING'`, wired to `postApiAiActionsIdCancel` (not a notification-specific endpoint — canceling a notification's underlying `PendingAiAction` is what resolves it, there's no separate "dismiss" concept).
- `pages/account.tsx` fetches the real account via `getApiAuthAccountId` on mount and persists edits via `patchApiAuthAccountId` (added specifically for this page — no other page updates `User` fields) instead of the old hardcoded local-state-only mock. Frontend field names don't all match the backend `User` columns they map to (`storeName→businessName`, `products→signatureProduct`, `persona→customerPersona`; `name`/`email`/`category`/`budget`/`location` are 1:1) — see the `BUSINESS_FIELD_TO_ACCOUNT_KEY` map in the file. `User.name` and `User.customerPersona` are new backend columns added to support this page (see `backend/CLAUDE.md`); neither existed before, so `name` starts empty until the user fills it in (there's no signup-time source for it) and `customerPersona` (the "AI Insight: ลูกค้าตัวจริงของคุณ" field) is user-editable free text, not actually AI-generated yet.
- `pages/campaign.tsx` (the campaign list) merges the static `data/campaigns.ts` demo data with real campaigns fetched from `getApiCampaigns` — `toCampaignItem` (extracted to `src/lib/campaignAdapters.ts`, shared with `campaignReport.tsx`/`campaignEdit.tsx`/`creativeCreate.tsx` below) adapts a real `Campaign` (`name/caption/status/budget/startDate/endDate`) into the richer mock `CampaignItem` shape, defaulting every analytics field (reach/clicks/roi/creatives/...) to empty since the real model doesn't have them yet; adapted items carry `source: 'api'`. For those items the card now renders real edit/delete/pause-resume controls instead of a "coming soon" placeholder: "แก้ไข" links to `/campaign/:id/edit`, "ลบ" opens `ConfirmDialog` and calls `deleteApiCampaignsId`, and pause/resume call `patchApiCampaignsId({ status })` — all via `patchApiCampaignsId`/`deleteApiCampaignsId` in the generated client, originally added for the AI confirm-flow and now also wired into this human-facing UI.
- `campaignReport.tsx`, `campaignEdit.tsx`, and `creativeCreate.tsx` no longer 404 for a real (API-backed) campaign id: each first checks the static mock array, then falls back to `getApiCampaignsId` + `toCampaignItem` before giving up with "ไม่พบแคมเปญนี้". `campaignReport.tsx` renders API campaigns through the same layout — analytics sections (trend chart, channel donut, creatives grid) show a short empty-state message instead of an empty chart since the adapter defaults those fields to `0`/`[]`, and the header's pause/stop/resume buttons call `patchApiCampaignsId` for API campaigns instead of only touching local state. `campaignEdit.tsx` renders a different, simpler form for API campaigns (name/caption/budget/dates/status — the mock-only channel-split and interest-chip UI has no equivalent on the real `Campaign` model) that submits via `patchApiCampaignsId`; mock campaigns keep the original rich, non-persisting demo form. `creativeCreate.tsx`'s generation flow itself is unchanged (still the fake random-placeholder simulation in `creativeProcessing.tsx` — real AI creative generation is a separate, not-yet-built feature); a creative added there for a real campaign flows into `campaignReport.tsx` via router state exactly like it does for mock campaigns, i.e. session-only, not persisted (no backend `Creative` model exists yet).
- The "New Campaign" wizard (`campaignCreate.tsx` → `campaignProcessing.tsx` → `campaignReview.tsx`, routed at `/campaign/new`, `/campaign/new/processing`, `/campaign/new/review`) now calls the real backend instead of being a fully mocked demo. `campaignProcessing.tsx` sends the user's brief to `postApiAiMessages` (the same endpoint `pages/ai.tsx`'s chat uses — a wizard-created campaign therefore shows up in the user's regular AI chat history too, since there's one `Conversation` per user server-side) and looks for an assistant reply carrying a `pendingAction` with `status === 'PENDING'` and `type === 'CREATE'`. If found, it navigates to `/campaign/new/review` with that `pendingAction` in router state; if the model asked a clarifying question instead (no pending action), it navigates back to `/campaign/new` with the reply text in state, which `campaignCreate.tsx` displays above the prompt textarea so the user can refine and resubmit. `campaignReview.tsx` reads `pendingAction` from router state (redirecting to `/campaign/new` if it's missing — a `PendingAiAction` is short-lived server state, there's no support for landing on this route directly/refreshing) and renders the AI's actual proposed fields (name/budget/caption/dates, via the shared `pendingActionSummary`) in a "รายละเอียดที่ AI เสนอ" card. The forecast, audience/interest, per-channel budget split, and 3 example-creative sections are still static illustrative content (unchanged from before) but now visibly marked with an "ตัวอย่าง" badge (same pattern as the demo AI-recommendation cards on `home.tsx`) since real values would require Meta/Google ad-account data this app doesn't have access to — don't mistake them for computed output. "เปิดตัวแคมเปญเลย"/"บันทึกเป็นฉบับร่าง" call `postApiAiActionsIdConfirm` with `publish: true`/`false`; "เริ่มใหม่ด้วยบรีฟอื่น" calls `postApiAiActionsIdCancel`.

### Frameworks & libraries

- React 19 + TypeScript, bundled with Vite 8 (`@vitejs/plugin-react`).
- Routing: `react-router-dom` v7 (`BrowserRouter` in `main.tsx`, `Routes`/`Route` in `App.tsx`). The route table is built out (auth, onboarding, and an authenticated dashboard layout) — see `App.tsx` directly for the current list rather than assuming from nav links, since `navbar.tsx` may still link to routes ahead of or behind what's actually mounted.
- Styling: Tailwind CSS v4 via `@tailwindcss/vite` (CSS-first config, no `tailwind.config.js`). `@tailwindcss/postcss` is also present as a dependency but unused while the Vite plugin is active.
- Formatting: Prettier with `prettier-plugin-tailwindcss` (auto-sorts class lists) and `singleQuote`/no-semi — run `pnpm format` after generating new components so class order matches the rest of the repo.

### Asset management

- Static assets live in `src/assets/` and are imported as ES modules (`import logo from '@/assets/2.png'`), not referenced from `public/`. No CDN, no image-optimization pipeline — Vite's default asset handling only.
- Two naming conventions coexist: semantically-named SVG icons (`home.svg`, `rocket.svg`, `sparklebold.svg`) vs. numbered/opaque PNGs (`1.png`, `2.png`, `3.png`, `hero.png`) that appear to be raw Figma exports. When exporting new assets from Figma via MCP, give them descriptive kebab-case names (`logo-mark.png`, not `4.png`) rather than continuing the numbered pattern.
- Import with the `@/` path alias (configured in both `vite.config.ts` and `tsconfig.app.json`), e.g. `import home from '@/assets/home.svg'`.

### Icon system

Two icon approaches currently coexist — pick deliberately rather than defaulting to one:

1. **`lucide-react`** components, used in `Topbar.tsx` for generic UI chrome (`Bell`, `Settings`, `CircleUserRound`), styled via Tailwind className (including arbitrary hex colors like `text-[#8E98A8]`):
   ```tsx
   import { Bell } from 'lucide-react'
   ;<Bell className="h-10 w-10 text-[#8E98A8] transition-all hover:text-[#6B7280]" />
   ```
2. **Standalone SVG files** in `src/assets/`, imported and rendered through `<img>`, used in `navbar.tsx` for brand/nav icons that came from Figma exports:
   ```tsx
   import home from '@/assets/home.svg'
   ;<img src={home} alt="Home" className="h-6 w-6" />
   ```
   Active/inactive tinting on these is done with a blunt `brightness-0` filter (`${activeButton === 'home' ? 'brightness-0' : ''}`), not `currentColor` — these SVGs are not currently recolorable via Tailwind text-color classes.

Guidance until the team consolidates: use `lucide-react` for generic/interactive UI icons (nav bar chrome, action buttons), and exported SVGs from `src/assets/` for brand-specific or illustrative icons that don't exist in Lucide's set. No centralized icon size scale exists — sizes are set ad hoc per usage (`h-6 w-6`, `h-9 w-9`, `h-10 w-10`).

### Styling approach

- Tailwind utility classes inline in JSX only — no CSS Modules, styled-components, or emotion. Global CSS is limited to `src/index.css` (font imports, `@theme` tokens, `html,body,#root { height: 100% }`).
- No responsive breakpoints are in use anywhere yet (no `sm:`/`md:`/`lg:` variants observed) — layouts use fixed widths (`w-80`, `w-7xl`, `w-75`). The app is currently desktop-only; don't assume mobile layouts are handled, and flag it if a Figma design implies responsive behavior.
- Bilingual text: Thai copy is paired with `font-thai` (Kanit), matching the language actually rendered — check which language a Figma text layer is set in before choosing the font class.

### Project structure

```
src/
  api/          # env.ts (apiBaseUrl) + generated/client.ts (orval, do not hand-edit)
  assets/       # images & icons, imported as ES modules
  components/   # shared components (Navbar, Topbar, notificationPanel, onboarding*)
  lib/          # small stateful helpers, e.g. userId.ts (auth/session storage)
  pages/        # route-level components (home, account, campaign, setting, onboarding*, ai, ...)
  App.tsx       # shell layout (Navbar + Topbar + Routes)
  main.tsx      # entry point: StrictMode > BrowserRouter > App
  index.css     # Tailwind entry point + @theme design tokens
```

No feature-based folder structure yet — just a flat `components/` vs `pages/` split. Don't invent new top-level folders (e.g. `features/`, `design-system/`) for Figma-derived work without checking with the user first, since the project hasn't established that pattern.
