import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AiMessageSchema,
  SendAiMessageSchema,
  SendAiMessageResponseSchema,
} from '../schemas/ai.schema.js'
import * as aiService from '../services/ai.service.js'
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AiContentFilterError,
} from '../lib/openai.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { MessageModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeMessage(message: MessageModel) {
  return {
    id: message.id,
    role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
    text: message.content,
    list: message.list.length > 0 ? message.list : null,
    closing: message.closing,
    createdAt: message.createdAt.toISOString(),
  }
}

export const aiApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listMessagesRoute = createRoute({
  method: 'get',
  path: '/messages',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AiMessageSchema) } },
      description: 'Conversation history for a user',
    },
  },
})
aiApp.openapi(listMessagesRoute, async (c) => {
  const userId = c.get('userId')
  const messages = await aiService.getConversationMessages(userId)
  return c.json(messages.map(serializeMessage), 200)
})

const sendMessageRoute = createRoute({
  method: 'post',
  path: '/messages',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: { 'application/json': { schema: SendAiMessageSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: SendAiMessageResponseSchema } },
      description: 'Sent message + AI reply',
    },
    422: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Blocked by content filter',
    },
    429: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'AI rate limited',
    },
    503: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'AI not configured',
    },
  },
})
aiApp.openapi(sendMessageRoute, async (c) => {
  const userId = c.get('userId')
  const { text } = c.req.valid('json')
  try {
    const { userMessage, assistantMessage } = await aiService.sendMessage(
      userId,
      text,
    )
    return c.json(
      {
        userMessage: serializeMessage(userMessage),
        assistantMessage: serializeMessage(assistantMessage),
      },
      201,
    )
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return c.json({ message: 'AI service is not configured yet' }, 503)
    }
    if (err instanceof AiRateLimitError) {
      return c.json(
        { message: 'AI is busy right now, please try again shortly' },
        429,
      )
    }
    if (err instanceof AiContentFilterError) {
      return c.json(
        { message: 'Message blocked by content safety filter' },
        422,
      )
    }
    throw err
  }
})
