import { z } from '@hono/zod-openapi'
import { PendingAiActionSchema } from './pending-ai-action.schema.js'

export const AiMessageRoleEnum = z.enum(['user', 'assistant'])

export const AiMessageSchema = z
  .object({
    id: z.string(),
    role: AiMessageRoleEnum,
    text: z.string(),
    list: z.array(z.string()).nullable(),
    closing: z.string().nullable(),
    createdAt: z.iso.datetime(),
    pendingAction: PendingAiActionSchema.nullable().optional(),
    redacted: z.boolean().optional(),
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
    assistantMessages: z.array(AiMessageSchema).min(1),
    // True when the AI couldn't answer and assistantMessages holds the saved
    // apology instead — the frontend shows its error toast on this.
    aiUnavailable: z.boolean(),
  })
  .openapi('SendAiMessageResponse')

export const GenerateCreativeSchema = z
  .object({
    prompt: z.string().min(1).max(2000),
  })
  .openapi('GenerateCreativeInput')

export const GenerateCreativeResponseSchema = z
  .object({
    caption: z.string(),
    // Non-blocking warnings from lib/ai-content-screen.ts, shown next to the
    // suggested caption so the user reviews it before using it.
    contentWarnings: z.array(z.string()),
  })
  .openapi('GenerateCreativeResponse')

export type SendAiMessageInput = z.infer<typeof SendAiMessageSchema>
export type GenerateCreativeInput = z.infer<typeof GenerateCreativeSchema>
