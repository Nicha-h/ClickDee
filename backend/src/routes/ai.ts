import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AiMessageSchema,
  SendAiMessageSchema,
  SendAiMessageResponseSchema,
  GenerateCreativeSchema,
  GenerateCreativeResponseSchema,
} from '../schemas/ai.schema.js'
import { CampaignIdParamSchema } from '../schemas/campaign.schema.js'
import {
  ConfirmPendingActionSchema,
  ConfirmPendingActionResponseSchema,
  CancelPendingActionResponseSchema,
  PendingActionIdParamSchema,
} from '../schemas/pending-ai-action.schema.js'
import { RecommendationsResponseSchema } from '../schemas/recommendation.schema.js'
import {
  InsightsResponseSchema,
  CampaignInsightsResponseSchema,
} from '../schemas/insight.schema.js'
import { IdeasResponseSchema } from '../schemas/idea.schema.js'
import * as aiService from '../services/ai.service.js'
import * as pendingActionService from '../services/pending-ai-action.service.js'
import * as campaignService from '../services/campaign.service.js'
import * as recommendationAiService from '../services/recommendation-ai.service.js'
import * as creativeAiService from '../services/creative-ai.service.js'
import * as insightAiService from '../services/insight-ai.service.js'
import * as ideaAiService from '../services/idea-ai.service.js'
import * as userService from '../services/user.service.js'
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AiContentFilterError,
  isAiConfigured,
} from '../lib/openai.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import {
  screenCaptionContent,
  captionWarningMessages,
} from '../lib/caption-content-screen.js'
import type {
  MessageModel,
  PendingAiActionModel,
} from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

type MessageWithPendingAction = MessageModel & {
  pendingAction?: PendingAiActionModel | null
}

function serializePendingAction(action: PendingAiActionModel) {
  const payload = action.payload as Record<string, unknown>
  const caption =
    typeof payload.caption === 'string' ? payload.caption : undefined
  return {
    id: action.id,
    type: action.type,
    targetCampaignId: action.targetCampaignId,
    payload,
    status: action.status,
    createdAt: action.createdAt.toISOString(),
    contentWarnings: captionWarningMessages(screenCaptionContent(caption)),
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

const getRecommendationsRoute = createRoute({
  method: 'get',
  path: '/recommendations',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: {
        'application/json': { schema: RecommendationsResponseSchema },
      },
      description:
        "AI-generated suggestions from the caller's real campaigns, or hasCampaigns:false if they have none yet",
    },
  },
})
aiApp.openapi(getRecommendationsRoute, async (c) => {
  const userId = c.get('userId')
  const campaigns = await campaignService.listCampaigns(userId)
  if (campaigns.length === 0) {
    return c.json({ hasCampaigns: false, recommendations: [] }, 200)
  }
  const { recommendations } =
    await recommendationAiService.generateRecommendations(campaigns)
  return c.json({ hasCampaigns: true, recommendations }, 200)
})

const getInsightsRoute = createRoute({
  method: 'get',
  path: '/insights',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: InsightsResponseSchema } },
      description:
        "AI-generated summary observations from the caller's real campaigns, or hasCampaigns:false if they have none yet",
    },
  },
})
aiApp.openapi(getInsightsRoute, async (c) => {
  const userId = c.get('userId')
  const campaigns = await campaignService.listCampaigns(userId)
  if (campaigns.length === 0) {
    return c.json({ hasCampaigns: false, insights: [] }, 200)
  }
  const { insights } = await insightAiService.generateInsights(campaigns)
  return c.json({ hasCampaigns: true, insights }, 200)
})

const getCampaignInsightsRoute = createRoute({
  method: 'get',
  path: '/campaigns/{id}/insights',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  request: { params: CampaignIdParamSchema },
  responses: {
    200: {
      content: {
        'application/json': { schema: CampaignInsightsResponseSchema },
      },
      description: 'AI-generated summary observations for a single campaign',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
aiApp.openapi(getCampaignInsightsRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const campaign = await campaignService.getCampaignById(userId, id)
  if (!campaign) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  const { insights } = await insightAiService.generateInsights([campaign])
  return c.json({ insights }, 200)
})

const getCampaignIdeasRoute = createRoute({
  method: 'get',
  path: '/campaign-ideas',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: IdeasResponseSchema } },
      description:
        "AI-generated quick-start campaign brief ideas from the caller's business profile",
    },
  },
})
aiApp.openapi(getCampaignIdeasRoute, async (c) => {
  const userId = c.get('userId')
  const user = await userService.findUserById(userId)
  const { ideas } = await ideaAiService.generateCampaignIdeas(user)
  return c.json({ ideas }, 200)
})

const getCreativeIdeasRoute = createRoute({
  method: 'get',
  path: '/campaigns/{id}/creative-ideas',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  request: { params: CampaignIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: IdeasResponseSchema } },
      description:
        'AI-generated quick-start creative brief ideas for a single campaign',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
aiApp.openapi(getCreativeIdeasRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const campaign = await campaignService.getCampaignById(userId, id)
  if (!campaign) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  const user = await userService.findUserById(userId)
  const { ideas } = await ideaAiService.generateCreativeIdeas(campaign, user)
  return c.json({ ideas }, 200)
})

const getAiStatusRoute = createRoute({
  method: 'get',
  path: '/status',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({ status: z.enum(['active', 'inactive']) }),
        },
      },
      description: 'Whether an AI provider is configured on the backend',
    },
  },
})
aiApp.openapi(getAiStatusRoute, async (c) => {
  return c.json({ status: isAiConfigured() ? 'active' : 'inactive' }, 200)
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

const generateCreativeRoute = createRoute({
  method: 'post',
  path: '/campaigns/{id}/creative',
  tags: ['AI'],
  middleware: [requireAuth] as const,
  request: {
    params: CampaignIdParamSchema,
    body: {
      content: { 'application/json': { schema: GenerateCreativeSchema } },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: GenerateCreativeResponseSchema },
      },
      description: 'AI-generated creative caption for the campaign',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
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
aiApp.openapi(generateCreativeRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const { prompt } = c.req.valid('json')
  const campaign = await campaignService.getCampaignById(userId, id)
  if (!campaign) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  try {
    const caption = await creativeAiService.generateCreativeCaption(
      campaign,
      prompt,
    )
    return c.json({ caption }, 200)
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
