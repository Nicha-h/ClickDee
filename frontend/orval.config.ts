import { defineConfig } from 'orval'

export default defineConfig({
  clickdee: {
    input: {
      target: 'http://localhost:3000/openapi.json',
    },
    output: {
      mode: 'single',
      target: 'src/api/generated/client.ts',
      client: 'fetch',
      baseUrl: {
        runtime: 'apiBaseUrl',
        imports: [{ name: 'apiBaseUrl', importPath: '../env' }],
      },
      clean: true,
      prettier: true,
    },
  },
})
