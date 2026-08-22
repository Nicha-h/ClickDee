import aiMascot from '@/assets/placeholders/ai-mascot.png'
import type { CampaignItem, CampaignStatus } from '@/data/campaigns'
import type { Campaign as ApiCampaign } from '@/api/generated/client'

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
    thumbnail: aiMascot,
    title: campaign.name,
    goal:
      status === 'draft'
        ? 'สร้างโดย AI ผู้ช่วย · ยังไม่เผยแพร่'
        : `งบทั้งหมด ฿${Number(campaign.budget).toLocaleString()}`,
    status,
    source: 'api',
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
