import { defineConfig } from 'vitest/config'

// Opt-in config for live (non-mocked, real-API-call) AI tests. Kept
// separate from vitest.config.ts so `pnpm test`/`test:watch` never picks
// these up by accident — only `pnpm test:live` does. See
// src/lib/ai-live-test-guard.ts for the per-run call budget these tests
// must go through.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.live.test.ts'],
  },
})
