import { z } from '@hono/zod-openapi'

export const RecommendationSchema = z
  .object({
    campaignId: z.string(),
    title: z.string(),
    description: z.string(),
    actionLabel: z.string(),
  })
  .openapi('Recommendation')

export const RecommendationsResponseSchema = z
  .object({
    hasCampaigns: z.boolean(),
    recommendations: z.array(RecommendationSchema).max(3),
  })
  .openapi('RecommendationsResponse')
