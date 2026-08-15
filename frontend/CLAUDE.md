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

- `orval.config.ts` generates `src/api/generated/client.ts` from the backend's live OpenAPI spec (`pnpm generate:api`, requires the backend dev server running on `http://localhost:3000`) — **do not hand-edit** the generated file. Every generated function takes an optional trailing `options?: RequestInit`, which is how per-call headers get attached (see below); there is no orval `mutator` configured.
- Auth is a bearer JWT returned as `token` by `postApiAuthSignup`/`postApiAuthLogin`. `src/lib/userId.ts` stores it (`getAuthToken`/`setAuthToken`/`clearAuthToken`, `localStorage`, alongside the pre-existing `userId` helpers) and exports `authHeaders()` — pass `authHeaders()` as the trailing `options` argument on any call to an auth-protected endpoint, e.g. `getApiAuthAccountId(id, authHeaders())` or `postApiAiMessages({ text }, authHeaders())`. This is the established pattern for attaching auth; a global orval mutator was deliberately not used (would require guessing at its exact fetch-client contract for a "minimal auth" scope) — keep following the per-call pattern rather than introducing a mutator later without a reason.
- On logout / account deletion, clear both `clearUserId()` and `clearAuthToken()` (see `setting.tsx`).

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

- `src/components/` — shared/reusable components (`navbar.tsx`, `Topbar.tsx`, `notification.tsx`). File casing is inconsistent (`Topbar.tsx` vs `navbar.tsx`); match whichever a sibling file already does rather than establishing a new casing.
- `src/pages/` — route-level components. Coverage is uneven: `home.tsx`, `setting.tsx`, `ai.tsx`, and the `onboarding*.tsx` pages are fully built; don't assume any other page still matches the old "empty shell" (`export default function x() { return <div></div> }`) placeholder pattern without checking — verify the specific file rather than assuming either way.
- No component library dependency (no shadcn/ui, Radix, MUI, etc.) and no Storybook — components are hand-built with Tailwind utility classes directly in JSX.
- No variant system (no `class-variance-authority`/`cva`, no `clsx`/`tailwind-merge`) — conditional styling is done with plain template-literal ternaries reading local `useState`, e.g. in `navbar.tsx`:
  ```tsx
  className={`... ${activeButton === 'home' ? 'bg-citrus-light' : 'bg-amalfi'} ...`}
  ```
  Follow this pattern for now rather than introducing `cva`/`clsx` unasked. Note `react-router-dom`'s `NavLink` already supports an `isActive` render-prop pattern that would replace the manual `activeButton` state — worth flagging if refactoring, not silently changing.
- Default exports, one component per file, matching the file's base name.
- Onboarding has two distinct step patterns — pick the matching one when extending it, don't blend them: `onboardingWizard.tsx` renders a **fixed, known-in-advance** `OnboardingStepConfig[]` (used for the base business-info steps, `data/onboarding.ts`). `onboardingAiFollowup.tsx` instead drives a loop of **AI-generated, one-at-a-time** questions (`pages/onboardingProcessing.tsx` fetches the first via `postApiOnboardingFollowupQuestion`, then the component fetches each next one after an answer is submitted) — the step count isn't known upfront, only capped (`MAX_FOLLOWUP_QUESTIONS = 5`, mirrored from the backend's own hard cap; the backend cap is authoritative, the frontend one is just so the UI doesn't wait on a network round-trip it already knows will be refused). It also gates on an explicit consent checkbox before collecting anything — see `docs`/`backend/CLAUDE.md`'s **Sensitive data** section for where those answers end up.

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
  components/   # shared components (Navbar, Topbar, notification, onboarding*)
  lib/          # small stateful helpers, e.g. userId.ts (auth/session storage)
  pages/        # route-level components (home, account, campaign, setting, onboarding*, ai, ...)
  App.tsx       # shell layout (Navbar + Topbar + Routes)
  main.tsx      # entry point: StrictMode > BrowserRouter > App
  index.css     # Tailwind entry point + @theme design tokens
```

No feature-based folder structure yet — just a flat `components/` vs `pages/` split. Don't invent new top-level folders (e.g. `features/`, `design-system/`) for Figma-derived work without checking with the user first, since the project hasn't established that pattern.
