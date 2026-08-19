import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AiMessageSchema,
  SendAiMessageSchema,
  SendAiMessageResponseSchema,
} from '../schemas/ai.schema.js'
import {
  ConfirmPendingActionSchema,
  ConfirmPendingActionResponseSchema,
  CancelPendingActionResponseSchema,
  PendingActionIdParamSchema,
} from '../schemas/pending-ai-action.schema.js'
import * as aiService from '../services/ai.service.js'
import * as pendingActionService from '../services/pending-ai-action.service.js'
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AiContentFilterError,
} from '../lib/openai.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type {
  MessageModel,
  PendingAiActionModel,
} from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

type MessageWithPendingAction = MessageModel & {
  pendingAction?: PendingAiActionModel | null
}

function serializePendingAction(action: PendingAiActionModel) {
  return {
    id: action.id,
    type: action.type,
    targetCampaignId: action.targetCampaignId,
    payload: action.payload as Record<string, unknown>,
    status: action.status,
    createdAt: action.createdAt.toISOString(),
  }
}

function serializeMessage(message: MessageWithPendingAction) {
  return {
    id: message.id,
    role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
    text: message.content,
    list: message.list.length > 0 ? message.list : null,
    closing: message.closing,
    createdAt: message.createdAt.toISOString(),
    pendingAction: message.pendingAction
      ? serializePendingAction(message.pendingAction)
      : null,
    redacted: message.redacted,
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
      description:
        'Sent message + AI reply (one or more chat bubbles, in order)',
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
    const { userMessage, assistantMessages } = await aiService.sendMessage(
      userId,
      text,
    )
    return c.json(
      {
        userMessage: serializeMessage(userMessage),
        assistantMessages: assistantMessages.map(serializeMessage),
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

const confirmActionRoute = createRoute({
  method: 'post',
  path: '/actions/{id}/confirm',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  request: {
    params: PendingActionIdParamSchema,
    body: {
      content: { 'application/json': { schema: ConfirmPendingActionSchema } },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: ConfirmPendingActionResponseSchema },
      },
      description: 'Action confirmed and executed',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Pending action not found, or its target campaign is gone',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Action is no longer pending',
    },
  },
})
aiApp.openapi(confirmActionRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const { publish } = c.req.valid('json')
  const result = await pendingActionService.confirmPendingAction(
    userId,
    id,
    publish,
  )
  if (result.outcome === 'notFound') {
    return c.json({ message: 'Pending action not found' }, 404)
  }
  if (result.outcome === 'targetGone') {
    return c.json(
      { message: 'The campaign this was about to change no longer exists' },
      404,
    )
  }
  if (result.outcome === 'invalidState') {
    return c.json(
      { message: `Action is already ${result.status.toLowerCase()}` },
      409,
    )
  }
  return c.json(
    { campaignId: result.campaignId, status: 'CONFIRMED' as const },
    200,
  )
})

const cancelActionRoute = createRoute({
  method: 'post',
  path: '/actions/{id}/cancel',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  request: { params: PendingActionIdParamSchema },
  responses: {
    200: {
      content: {
        'application/json': { schema: CancelPendingActionResponseSchema },
      },
      description: 'Action canceled',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Pending action not found',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Action is no longer pending',
    },
  },
})
aiApp.openapi(cancelActionRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const result = await pendingActionService.cancelPendingAction(userId, id)
  if (result.outcome === 'notFound') {
    return c.json({ message: 'Pending action not found' }, 404)
  }
  if (result.outcome === 'invalidState') {
    return c.json(
      { message: `Action is already ${result.status.toLowerCase()}` },
      409,
    )
  }
  return c.json({ status: 'CANCELED' as const }, 200)
})
