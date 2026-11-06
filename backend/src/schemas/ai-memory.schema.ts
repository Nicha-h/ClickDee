import { z } from '@hono/zod-openapi'

export const AiMemoryItemSchema = z
  .object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
    createdAt: z.iso.datetime(),
  })
  .openapi('AiMemoryItem')

export const AiMemoryIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})
