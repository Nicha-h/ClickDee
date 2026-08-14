import type { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'

export function registerErrorHandlers(app: OpenAPIHono) {
  app.notFound((c) => c.json({ message: 'Not Found' }, 404))

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ message: err.message }, err.status)
    }
    console.error(err)
    return c.json({ message: 'Internal Server Error' }, 500)
  })
}
