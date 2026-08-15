import { z } from '@hono/zod-openapi'

export const AiMessageRoleEnum = z.enum(['user', 'assistant'])

export const AiMessageSchema = z
  .object({
    id: z.string(),
    role: AiMessageRoleEnum,
    text: z.string(),
    list: z.array(z.string()).nullable(),
    closing: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi('AiMessage')

export const SendAiMessageSchema = z
  .object({
    text: z.string().min(1).max(4000),
  })
  .openapi('SendAiMessageInput')

export const SendAiMessageResponseSchema = z
  .object({
    userMessage: AiMessageSchema,
    assistantMessage: AiMessageSchema,
  })
  .openapi('SendAiMessageResponse')

export type SendAiMessageInput = z.infer<typeof SendAiMessageSchema>
