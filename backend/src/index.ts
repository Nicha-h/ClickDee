import { serve } from '@hono/node-server'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const app = new OpenAPIHono() 

const HelloSchema = z.object({
  message: z.string().openapi({ example: 'Hello from ClickDee Backend!' }),
}).openapi('HelloResponse') //

const route = createRoute({
  method: 'get',
  path: '/api/hello', 
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HelloSchema, 
        },
      },
      description: 'Retrieve a greeting',
    },
  },
}) 
app.openapi(route, (c) => { //
  return c.json({
    message: 'Hello from ClickDee Backend!',
  }, 200) //
})


app.doc('/openapi.json', { 
  openapi: '3.0.0', 
  info: {
    version: '1.0.0', 
    title: 'ClickDee API', 
  },
}) 
const port = 3000
console.log(`Server is running on http://localhost:${port}`)
serve({
  fetch: app.fetch,
  port
})