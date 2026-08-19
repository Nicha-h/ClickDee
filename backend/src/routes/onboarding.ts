import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  FollowupQuestionRequestSchema,
  FollowupQuestionResponseSchema,
} from '../schemas/onboarding.schema.js'
import * as onboardingAiService from '../services/onboarding-ai.service.js'
import { AiNotConfiguredError, AiRateLimitError } from '../lib/openai.js'
import { rateLimit } from '../middleware/rate-limit.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

export const onboardingApp = new OpenAPIHono()

const followupLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 20 })

const followupQuestionRoute = createRoute({
  method: 'post',
  path: '/followup-question',
  tags: ['Onboarding'],
  middleware: [followupLimiter] as const,
  request: {
    body: {
      content: {
        'application/json': { schema: FollowupQuestionRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': { schema: FollowupQuestionResponseSchema },
      },
      description:
        'Next AI follow-up question (free-text or multiple-choice), or done',
    },
    429: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Rate limited',
    },
    503: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'AI not configured',
    },
  },
})
onboardingApp.openapi(followupQuestionRoute, async (c) => {
  const { businessProfile, previousAnswers } = c.req.valid('json')
  try {
    const result = await onboardingAiService.generateFollowupQuestion(
      businessProfile,
      previousAnswers,
    )
    return c.json(result, 200)
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
    throw err
  }
})
