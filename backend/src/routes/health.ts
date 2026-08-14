import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const HealthSchema = z
  .object({
    status: z.literal('ok'),
  })
  .openapi('Health')

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  responses: {
    200: {
      content: { 'application/json': { schema: HealthSchema } },
      description: 'Service health check',
    },
  },
})

export const healthApp = new OpenAPIHono()

healthApp.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok' as const }, 200)
})
