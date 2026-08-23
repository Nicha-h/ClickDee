import { z } from '@hono/zod-openapi'

export const InsightsResponseSchema = z
  .object({
    hasCampaigns: z.boolean(),
    insights: z.array(z.string()).max(3),
  })
  .openapi('InsightsResponse')

export const CampaignInsightsResponseSchema = z
  .object({
    insights: z.array(z.string()).max(3),
  })
  .openapi('CampaignInsightsResponse')
