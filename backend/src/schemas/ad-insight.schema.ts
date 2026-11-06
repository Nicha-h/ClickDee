import { z } from '@hono/zod-openapi'

export const InsightLevelEnum = z.enum(['CAMPAIGN', 'ADSET', 'AD'])

export const InsightBreakdownEnum = z.enum(['publisher_platform', 'placement'])

export const InsightsQuerySchema = z
  .object({
    since: z.iso.datetime().optional(),
    until: z.iso.datetime().optional(),
    datePreset: z.string().optional(),
    breakdowns: z
      .string()
      .optional()
      .transform((v: string | undefined) => (v ? v.split(',') : undefined))
      .pipe(z.array(InsightBreakdownEnum).optional()),
    // Read the stored (cached) rows by default — respects Meta's rate limits
    // per Task 6's guidance to schedule/cache pulls rather than fetching
    // live on every dashboard view. Pass refresh=true to force a live pull.
    refresh: z
      .string()
      .optional()
      .transform((v: string | undefined) => v === 'true'),
    // Requests Meta's time_increment=1 (one row per day) instead of a single
    // aggregated row for the whole range — only meaningful together with
    // refresh=true, since a live pull is what actually produces per-day rows
    // to store. Only used with reads too, they'll just return whatever
    // per-day rows already exist in storage from prior daily=true pulls.
    daily: z
      .string()
      .optional()
      .transform((v: string | undefined) => v === 'true'),
  })
  .openapi('InsightsQuery')

const ActionBreakdownSchema = z.object({
  action_type: z.string(),
  value: z.string(),
})

export const AdInsightSchema = z
  .object({
    id: z.string(),
    level: InsightLevelEnum,
    dateStart: z.string(),
    dateStop: z.string(),
    publisherPlatform: z.string().nullable(),
    placement: z.string().nullable(),
    impressions: z.number().int(),
    reach: z.number().int(),
    frequency: z.number().nullable(),
    spend: z.string(),
    clicks: z.number().int(),
    uniqueClicks: z.number().int(),
    ctr: z.number().nullable(),
    cpc: z.number().nullable(),
    cpm: z.number().nullable(),
    actions: z.array(ActionBreakdownSchema).nullable(),
    costPerActionType: z.array(ActionBreakdownSchema).nullable(),
    videoP25Watched: z.number().int().nullable(),
    videoP50Watched: z.number().int().nullable(),
    videoP75Watched: z.number().int().nullable(),
    videoP100Watched: z.number().int().nullable(),
    videoThruplayWatched: z.number().int().nullable(),
    purchaseRoas: z.number().nullable(),
    fetchedAt: z.iso.datetime(),
  })
  .openapi('AdInsight')

export const CampaignIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export type InsightsQuery = z.infer<typeof InsightsQuerySchema>
