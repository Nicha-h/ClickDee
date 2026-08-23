import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  CampaignIdParamSchema,
  InsightsQuerySchema,
  AdInsightSchema,
} from '../schemas/ad-insight.schema.js'
import * as adInsightService from '../services/ad-insight.service.js'
import { prisma } from '../db/client.js'
import {
  getDevMetaCredentials,
  MetaNotConfiguredError,
} from '../config/meta.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { AdInsightModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeInsight(row: AdInsightModel) {
  return {
    id: row.id,
    level: row.level,
    dateStart: row.dateStart.toISOString().slice(0, 10),
    dateStop: row.dateStop.toISOString().slice(0, 10),
    publisherPlatform: row.publisherPlatform || null,
    placement: row.placement || null,
    impressions: row.impressions,
    reach: row.reach,
    frequency: row.frequency ? Number(row.frequency) : null,
    spend: row.spend.toString(),
    clicks: row.clicks,
    uniqueClicks: row.uniqueClicks,
    ctr: row.ctr ? Number(row.ctr) : null,
    cpc: row.cpc ? Number(row.cpc) : null,
    cpm: row.cpm ? Number(row.cpm) : null,
    actions: row.actions as { action_type: string; value: string }[] | null,
    costPerActionType: row.costPerActionType as
      { action_type: string; value: string }[] | null,
    videoP25Watched: row.videoP25Watched,
    videoP50Watched: row.videoP50Watched,
    videoP75Watched: row.videoP75Watched,
    videoP100Watched: row.videoP100Watched,
    videoThruplayWatched: row.videoThruplayWatched,
    purchaseRoas: row.purchaseRoas ? Number(row.purchaseRoas) : null,
    fetchedAt: row.fetchedAt.toISOString(),
  }
}

export const insightsApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const getCampaignInsightsRoute = createRoute({
  method: 'get',
  path: '/{id}/insights',
  tags: ['Insights'],
  middleware: [requireAuth] as const,
  request: { params: CampaignIdParamSchema, query: InsightsQuerySchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AdInsightSchema) } },
      description:
        'Campaign-level Insights — reads stored rows by default; pass refresh=true to force a live Meta pull',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Meta not configured, or campaign not yet published to Meta',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
insightsApp.openapi(getCampaignInsightsRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const { since, until, datePreset, breakdowns, refresh, daily } =
    c.req.valid('query')

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId },
  })
  if (!campaign) return c.json({ message: 'Campaign not found' }, 404)

  if (refresh) {
    const credentials = getDevMetaCredentials()
    if (!credentials) throw new MetaNotConfiguredError()
    if (!campaign.metaCampaignId) {
      return c.json(
        {
          message:
            'Publish this campaign to Meta before pulling live insights.',
        },
        400,
      )
    }
    const rows = await adInsightService.fetchInsights({
      metaEntityId: campaign.metaCampaignId,
      credentials,
      since,
      until,
      datePreset,
      breakdowns,
      ...(daily && { timeIncrement: 1 }),
    })
    await adInsightService.storeInsights(
      userId,
      'CAMPAIGN',
      id,
      null,
      null,
      rows,
    )
  }

  const stored = await adInsightService.listStoredInsights(
    userId,
    'CAMPAIGN',
    id,
  )
  return c.json(stored.map(serializeInsight), 200)
})
