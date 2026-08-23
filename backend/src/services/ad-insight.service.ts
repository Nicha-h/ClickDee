import { prisma } from '../db/client.js'
import { metaRequest } from '../lib/meta-client.js'
import type { MetaCredentials } from '../config/meta.js'
import type { InsightLevel, Prisma } from '../generated/prisma/client.js'

const INSIGHT_FIELDS = [
  'impressions',
  'reach',
  'frequency',
  'spend',
  'clicks',
  'unique_clicks',
  'ctr',
  'cpc',
  'cpm',
  'actions',
  'cost_per_action_type',
  'video_p25_watched_actions',
  'video_p50_watched_actions',
  'video_p75_watched_actions',
  'video_p100_watched_actions',
  'video_thruplay_watched_actions',
  'purchase_roas',
  'date_start',
  'date_stop',
].join(',')

interface ActionValue {
  action_type: string
  value: string
}

interface RawInsightRow {
  date_start: string
  date_stop: string
  impressions?: string
  reach?: string
  frequency?: string
  spend?: string
  clicks?: string
  unique_clicks?: string
  ctr?: string
  cpc?: string
  cpm?: string
  actions?: ActionValue[]
  cost_per_action_type?: ActionValue[]
  video_p25_watched_actions?: ActionValue[]
  video_p50_watched_actions?: ActionValue[]
  video_p75_watched_actions?: ActionValue[]
  video_p100_watched_actions?: ActionValue[]
  video_thruplay_watched_actions?: ActionValue[]
  purchase_roas?: ActionValue[]
  publisher_platform?: string
  placement?: string
}

interface InsightsListResponse {
  data: RawInsightRow[]
}

export interface FetchInsightsParams {
  metaEntityId: string
  credentials: MetaCredentials
  since?: string
  until?: string
  datePreset?: string
  breakdowns?: string[]
  // Meta's time_increment — pass 1 to get one row per day instead of a
  // single row aggregated over the whole range (e.g. for a daily trend
  // chart). Omitted by default, matching Meta's own default (whole range).
  timeIncrement?: 1
}

// Sync Insights call. Task 6: large date ranges / many breakdowns should use
// Meta's async Insights job instead to avoid timeouts — not implemented
// here (no current caller needs it yet); flagged as the next thing to add
// if a `since`/`until` range or breakdown combination proves too heavy for
// a synchronous call in practice.
export async function fetchInsights(
  params: FetchInsightsParams,
): Promise<RawInsightRow[]> {
  const {
    metaEntityId,
    credentials,
    since,
    until,
    datePreset,
    breakdowns,
    timeIncrement,
  } = params

  const timeRange = since && until ? { since, until } : undefined

  const result = await metaRequest<InsightsListResponse>(
    `${metaEntityId}/insights`,
    {
      accessToken: credentials.accessToken,
      params: {
        fields: INSIGHT_FIELDS,
        ...(timeRange && { time_range: timeRange }),
        ...(!timeRange && datePreset && { date_preset: datePreset }),
        ...(timeIncrement && { time_increment: timeIncrement }),
        ...(breakdowns && breakdowns.length > 0 && { breakdowns }),
      },
    },
  )
  return result.data
}

function firstActionValue(actions?: ActionValue[]): number | null {
  if (!actions || actions.length === 0) return null
  const n = Number(actions[0].value)
  return Number.isFinite(n) ? n : null
}

function toDecimalOrNull(value?: string): number | null {
  if (value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function storeInsights(
  userId: string,
  level: InsightLevel,
  campaignId: string,
  adSetId: string | null,
  adId: string | null,
  rows: RawInsightRow[],
) {
  const adSetDedupKey = adSetId ?? ''
  const adDedupKey = adId ?? ''

  for (const row of rows) {
    const publisherPlatform = row.publisher_platform ?? ''
    const placement = row.placement ?? ''

    const data: Prisma.AdInsightUncheckedCreateInput = {
      level,
      userId,
      campaignId,
      adSetId,
      adId,
      adSetDedupKey,
      adDedupKey,
      publisherPlatform,
      placement,
      dateStart: new Date(row.date_start),
      dateStop: new Date(row.date_stop),
      impressions: Number(row.impressions ?? 0),
      reach: Number(row.reach ?? 0),
      frequency: toDecimalOrNull(row.frequency),
      spend: Number(row.spend ?? 0),
      clicks: Number(row.clicks ?? 0),
      uniqueClicks: Number(row.unique_clicks ?? 0),
      ctr: toDecimalOrNull(row.ctr),
      cpc: toDecimalOrNull(row.cpc),
      cpm: toDecimalOrNull(row.cpm),
      actions: (row.actions as Prisma.InputJsonValue | undefined) ?? undefined,
      costPerActionType:
        (row.cost_per_action_type as Prisma.InputJsonValue | undefined) ??
        undefined,
      videoP25Watched: firstActionValue(row.video_p25_watched_actions),
      videoP50Watched: firstActionValue(row.video_p50_watched_actions),
      videoP75Watched: firstActionValue(row.video_p75_watched_actions),
      videoP100Watched: firstActionValue(row.video_p100_watched_actions),
      videoThruplayWatched: firstActionValue(
        row.video_thruplay_watched_actions,
      ),
      purchaseRoas: firstActionValue(row.purchase_roas),
    }

    await prisma.adInsight.upsert({
      where: {
        level_campaignId_adSetDedupKey_adDedupKey_dateStart_dateStop_publisherPlatform_placement:
          {
            level,
            campaignId,
            adSetDedupKey,
            adDedupKey,
            dateStart: new Date(row.date_start),
            dateStop: new Date(row.date_stop),
            publisherPlatform,
            placement,
          },
      },
      create: data,
      update: data,
    })
  }
}

export function listStoredInsights(
  userId: string,
  level: InsightLevel,
  campaignId: string,
  adSetId?: string,
  adId?: string,
) {
  return prisma.adInsight.findMany({
    where: {
      userId,
      level,
      campaignId,
      ...(adSetId !== undefined && { adSetId }),
      ...(adId !== undefined && { adId }),
    },
    orderBy: { dateStart: 'desc' },
  })
}

// Entrypoint a future scheduler would call daily to keep stored Insights
// fresh without hitting Meta live on every dashboard view (Task 6). No
// scheduler exists in this codebase yet — same deliberate-tech-debt category
// as middleware/rate-limit.ts; don't build a cron for it here.
export async function syncInsightsForCampaign(
  userId: string,
  campaignId: string,
  credentials: MetaCredentials,
) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })
  if (!campaign?.metaCampaignId) return

  const rows = await fetchInsights({
    metaEntityId: campaign.metaCampaignId,
    credentials,
    datePreset: 'last_30d',
  })
  await storeInsights(userId, 'CAMPAIGN', campaignId, null, null, rows)
}
