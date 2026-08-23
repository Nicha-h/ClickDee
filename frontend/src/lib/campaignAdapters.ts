import defaultCampaignImage from '@/assets/decorative/default campaign.png'
import type {
  CampaignItem,
  CampaignStatus,
  DailyTrendPoint,
} from '@/data/campaigns'
import type { Campaign as ApiCampaign } from '@/api/generated/client'
import {
  getApiCampaignsCampaignIdAdSets,
  getApiCampaignsCampaignIdAdSetsAdSetIdCreatives,
  getApiCampaignsIdInsights,
} from '@/api/generated/client'
import { withCredentials } from '@/lib/userId'
import { summaryRows } from '@/lib/pendingAction'
import { resolveAssetUrl } from '@/lib/assetUrl'

// The real Campaign model only has name/status/budget/dates — none of the
// performance fields below exist server-side yet, so they default to
// empty/zero rather than being a bug specific to this adapter.
export const API_STATUS_MAP: Record<ApiCampaign['status'], CampaignStatus> = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DRAFT: 'draft',
  COMPLETED: 'ended',
}

export function toCampaignItem(campaign: ApiCampaign): CampaignItem {
  const status = API_STATUS_MAP[campaign.status]
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86_400_000))
    : Number.POSITIVE_INFINITY

  return {
    id: campaign.id,
    thumbnail: defaultCampaignImage,
    title: campaign.name,
    goal:
      status === 'draft'
        ? 'เป้าหมาย: สร้างโดย AI ผู้ช่วย · ยังไม่เผยแพร่'
        : `เป้าหมาย: งบทั้งหมด ฿${Number(campaign.budget).toLocaleString()}`,
    status,
    source: 'api',
    meta: {
      campaignId: campaign.metaCampaignId,
      status: campaign.metaStatus,
      effectiveStatus: campaign.metaEffectiveStatus,
      reviewFeedback: campaign.metaReviewFeedback,
      objective: campaign.objective,
      campaignBudgetOptimization: campaign.campaignBudgetOptimization,
    },
    daysRemaining,
    platforms: ['facebook'],
    reach: 0,
    clicks: 0,
    orders: 0,
    cpa: 0,
    roi: 0,
    adSpend: 0,
    budgetSpent: 0,
    budgetTotal: Number(campaign.budget),
    dailyAvgSpend: 0,
    roiBenchmark: 0,
    insights: [
      'แคมเปญนี้ยังไม่มีข้อมูลประสิทธิภาพ เนื่องจากยังไม่ได้เผยแพร่',
      'เมื่อแคมเปญเริ่มทำงาน AI จะวิเคราะห์และแนะนำการปรับปรุงให้ที่นี่',
      'เปิดใช้งานแคมเปญเพื่อเริ่มเก็บข้อมูลผลลัพธ์',
    ],
    dailyTrend: [],
    channelReach: [],
    creatives: [],
  }
}

// Real campaigns have no image field of their own — creative images live on
// AdCreative, nested under AdSet (Campaign -> AdSet -> AdCreative), and
// there's no single "give me this campaign's thumbnail" endpoint. This walks
// the ad sets in order and returns the first creative image found, mirroring
// the mediaAssetUrl/childAttachments shape campaignReport.tsx's
// CreativeDetail already reads off creativeDetails.
type ThumbnailCreativeDetails = {
  mediaAssetUrl?: string
  childAttachments?: { mediaAssetUrl?: string }[]
}

export async function fetchCampaignThumbnail(
  campaignId: string,
): Promise<string | null> {
  const adSetsRes = await getApiCampaignsCampaignIdAdSets(
    campaignId,
    withCredentials(),
  )
  if (adSetsRes.status !== 200) return null

  for (const adSet of adSetsRes.data) {
    const creativesRes = await getApiCampaignsCampaignIdAdSetsAdSetIdCreatives(
      campaignId,
      adSet.id,
      withCredentials(),
    )
    if (creativesRes.status !== 200) continue

    for (const creative of creativesRes.data) {
      const details = creative.creativeDetails as ThumbnailCreativeDetails
      const url =
        details.mediaAssetUrl ??
        details.childAttachments?.find((c) => c.mediaAssetUrl)?.mediaAssetUrl
      if (url) return resolveAssetUrl(url) ?? null
    }
  }

  return null
}

// Stored (non-refreshing) daily reach/spend + latest ROI for a campaign
// already pushed to Meta — used by home.tsx's running-campaigns card to
// feed its sparkline and ROI label, mirroring campaignReport.tsx's own
// fetchInsightsData mapping. Reads cached rows only (no refresh=true), same
// rate-limit-friendly default the report page uses. ROI comes from Meta's
// own purchase ROAS field (AdInsight.purchaseRoas) — null when no row has
// recorded a purchase yet, so callers fall back to the campaign's own
// placeholder `roi` rather than treating it as zero.
export async function fetchCampaignPerformance(
  campaignId: string,
): Promise<{ dailyTrend: DailyTrendPoint[]; roi: number | null }> {
  const res = await getApiCampaignsIdInsights(
    campaignId,
    { daily: 'true' },
    withCredentials(),
  )
  if (res.status !== 200) return { dailyTrend: [], roi: null }

  const rows = [...res.data].sort((a, b) =>
    a.dateStart.localeCompare(b.dateStart),
  )
  const dailyTrend = rows.map((r) => ({
    date: r.dateStart.slice(5),
    reach: r.reach,
    spend: Number(r.spend),
  }))
  const latestRoi =
    [...rows].reverse().find((r) => r.purchaseRoas !== null)?.purchaseRoas ??
    null

  return { dailyTrend, roi: latestRoi }
}

export function campaignSummaryRows(campaign: ApiCampaign): [string, string][] {
  return summaryRows({
    name: campaign.name,
    budget: Number(campaign.budget),
    startDate: campaign.startDate,
    endDate: campaign.endDate ?? undefined,
    caption: campaign.caption,
  })
}
