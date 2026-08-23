import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Live (non-mocked) AI tests live under vitest.live.config.ts /
    // `pnpm test:live` — never run automatically here.
    exclude: [...configDefaults.exclude, '**/*.live.test.ts'],
  },
})
