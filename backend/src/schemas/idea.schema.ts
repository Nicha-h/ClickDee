import { z } from '@hono/zod-openapi'

export const IdeasResponseSchema = z
  .object({
    ideas: z.array(z.string()).max(3),
  })
  .openapi('IdeasResponse')
