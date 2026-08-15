import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AiMemoryItemSchema,
  AiMemoryIdParamSchema,
} from '../schemas/ai-memory.schema.js'
import * as onboardingService from '../services/onboarding.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

export const aiMemoryApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listAiMemoryRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['AI Memory'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AiMemoryItemSchema) } },
      description: "The caller's AI memory Q&A pairs",
    },
  },
})
aiMemoryApp.openapi(listAiMemoryRoute, async (c) => {
  const userId = c.get('userId')
  const items = await onboardingService.getAiMemoryItems(userId)
  return c.json(
    items.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      createdAt: item.createdAt.toISOString(),
    })),
    200,
  )
})

const deleteAiMemoryItemRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['AI Memory'],
  middleware: [requireAuth] as const,
  request: { params: AiMemoryIdParamSchema },
  responses: {
    204: {
      description: 'Deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Not found or not owned by the caller',
    },
  },
})
aiMemoryApp.openapi(deleteAiMemoryItemRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const result = await onboardingService.deleteAiMemoryItem(userId, id)
  if (result.count === 0) {
    return c.json({ message: 'AI memory item not found' }, 404)
  }
  return c.body(null, 204)
})

const clearAiMemoryRoute = createRoute({
  method: 'delete',
  path: '/',
  tags: ['AI Memory'],
  middleware: [requireAuth] as const,
  responses: {
    204: {
      description: "Cleared all of the caller's AI memory",
    },
  },
})
aiMemoryApp.openapi(clearAiMemoryRoute, async (c) => {
  const userId = c.get('userId')
  await onboardingService.clearAiMemory(userId)
  return c.body(null, 204)
})
