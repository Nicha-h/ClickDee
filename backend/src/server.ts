import { serve } from '@hono/node-server'
import { app } from './app.js'
import { env } from './config/env.js'

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
  console.log(`OpenAPI docs at http://localhost:${info.port}/docs`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0))
  })
}
