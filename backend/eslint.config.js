import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/generated']),
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Type-aware, so limited to files in tsconfig.json (which excludes tests).
    files: ['src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
])
