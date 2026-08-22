import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  Users,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  Pause,
  Play,
  Plus,
  Square,
  Pencil,
} from 'lucide-react'
import cash from '@/assets/icons/cash.svg'
import DonutChart from '@/components/donutChart'
import TrendChart from '@/components/trendChart'
import {
  indexToFirst,
  reachVsSpendSeries,
  percentFormatter,
} from '@/components/trendChartUtils'
import { campaigns, platformBadgeStyles } from '@/data/campaigns'
import type { Creative, CampaignItem } from '@/data/campaigns'
import CampaignReportSkeleton from '@/components/campaignReportSkeleton'
import { getApiCampaignsId, patchApiCampaignsId } from '@/api/generated/client'
import type { CampaignStatus as ApiCampaignStatus } from '@/api/generated/client'
import { toCampaignItem } from '@/lib/campaignAdapters'
import { withCredentials } from '@/lib/userId'

type ReportStatus = 'active' | 'paused' | 'stopped'

function MetricCard({
  icon,
  label,
  value,
  trend,
  caption,
}: {
  icon: ReactNode
  label: string
  value: string
  trend?: string
  caption: string
}) {
  return (
    <div className="w-full rounded-xl border border-[#8E98A8] bg-white p-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-thai text-amalfi text-xl font-bold">{label}</h3>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
          {value}
        </p>
        {trend && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#519b5c]">
            <TrendingUp className="h-4 w-4" />
            {trend}
          </span>
        )}
      </div>
      <p className="font-thai mt-2 text-base font-semibold text-black">
        {caption}
      </p>
    </div>
  )
}

function CreativeCard({ creative }: { creative: Creative }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#8E98A8]">
      <div className="relative">
        <img
          src={creative.image}
          alt={creative.caption}
          className="h-37 w-full object-cover"
        />
        <span
          className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-base font-semibold"
          style={{
            color: creative.badgeBorderColor,
            border: `1px solid ${creative.badgeBorderColor}`,
          }}
        >
          #{creative.rank}
        </span>
      </div>
      <div className="p-3">
        <p className="font-thai text-base text-black">{creative.caption}</p>
        <div className="mt-2 flex gap-4">
          <div>
            <p className="font-thai text-seadark text-base">การแสดงผล</p>
            <p className="text-base font-semibold text-black">
              {creative.impressions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-thai text-seadark text-base">CTR</p>
            <p className="text-base font-semibold text-black">
              {creative.ctr}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CampaignReport() {
  const { campaignId } = useParams()
  const mockCampaign = campaigns.find((c) => c.id === campaignId)
  const [apiCampaign, setApiCampaign] = useState<CampaignItem | null>(null)
  const [isLoading, setIsLoading] = useState(!mockCampaign)

  useEffect(() => {
    if (mockCampaign || !campaignId) return
    getApiCampaignsId(campaignId, withCredentials()).then((res) => {
      if (res.status === 200) {
        setApiCampaign(toCampaignItem(res.data))
      }
      setIsLoading(false)
    })
  }, [campaignId, mockCampaign])

  if (isLoading) return <CampaignReportSkeleton />

  const campaign = mockCampaign ?? apiCampaign
  if (!campaign) {
    return (
      <div className="flex min-h-full min-w-full flex-col items-center justify-center gap-4 py-10">
        <p className="font-thai text-xl text-black">ไม่พบแคมเปญนี้</p>
        <Link to="/campaign" className="font-thai text-amalfi underline">
          กลับไปหน้าแคมเปญ
        </Link>
      </div>
    )
  }

  const budgetPct =
    campaign.budgetTotal > 0
      ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
      : 0

  return <CampaignReportView campaign={campaign} budgetPct={budgetPct} />
}

function CampaignReportView({
  campaign,
  budgetPct,
}: {
  campaign: CampaignItem
  budgetPct: number
}) {
  const [status, setStatus] = useState<ReportStatus>(
    campaign.status === 'ended' || campaign.status === 'draft'
      ? 'stopped'
      : campaign.status,
  )

  const REPORT_STATUS_TO_API: Record<ReportStatus, ApiCampaignStatus> = {
    active: 'ACTIVE',
    paused: 'PAUSED',
    stopped: 'COMPLETED',
  }

  const handleSetStatus = async (next: ReportStatus) => {
    if (campaign.source !== 'api') {
      setStatus(next)
      return
    }
    const res = await patchApiCampaignsId(
      campaign.id,
      { status: REPORT_STATUS_TO_API[next] },
      withCredentials(),
    )
    if (res.status === 200) {
      setStatus(next)
    }
  }

  const location = useLocation()
  const [creatives] = useState<Creative[]>(() => {
    const newCreative = (
      location.state as {
        newCreative?: Omit<Creative, 'rank' | 'badgeBorderColor'>
      } | null
    )?.newCreative
    if (!newCreative) return campaign.creatives
    const worst = campaign.creatives.reduce((min, c) =>
      c.ctr < min.ctr ? c : min,
    )
    return campaign.creatives.map((c) =>
      c.rank === worst.rank
        ? {
            ...newCreative,
            rank: worst.rank,
            badgeBorderColor: worst.rank === 1 ? '#477099' : '#7f66ba',
          }
        : c,
    )
  })

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="font-thai flex flex-col gap-2 font-semibold">
          <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            {campaign.title}
          </h1>
          <p className="text-base font-semibold text-black">
            {campaign.goal}
            {status !== 'stopped' &&
              ` · ระยะเวลา: เหลืออีก ${campaign.daysRemaining} วัน`}
          </p>
        </div>
        <div className="font-thai flex flex-wrap items-center gap-3 text-xl">
          <Link
            to={`/campaign/${campaign.id}/edit`}
            className="hover:text-amalfidark flex items-center gap-2 text-[#8E98A8] hover:cursor-pointer hover:font-semibold"
          >
            <Pencil className="h-6 w-6" />
            แก้ไข
          </Link>
          {status === 'active' && (
            <button
              onClick={() => handleSetStatus('paused')}
              className="hover:text-amalfidark flex items-center gap-2 text-[#8E98A8] hover:cursor-pointer hover:font-semibold"
            >
              <Play className="h-6 w-6" />
              กำลังทำงาน
            </button>
          )}
          {status === 'paused' && (
            <>
              <button
                onClick={() => handleSetStatus('active')}
                className="flex items-center gap-2 text-[#8E98A8] hover:cursor-pointer hover:font-semibold"
              >
                <Pause className="h-6 w-6" />
                หยุดชั่วคราว
              </button>
              <button
                onClick={() => handleSetStatus('stopped')}
                className="border-[] flex items-center gap-1 rounded-[15px] border px-3 py-1 text-lg text-[#be2c2c] hover:cursor-pointer hover:font-semibold"
              >
                <Square className="h-4 w-4" />
                หยุดแคมเปญ
              </button>
            </>
          )}
          {status === 'stopped' && (
            <button
              onClick={() => handleSetStatus('active')}
              className="text-amalfi hover:text-amalfidark flex items-center gap-2 hover:cursor-pointer hover:font-semibold"
            >
              <Play className="h-6 w-6" />
              เริ่มแคมเปญใหม่
            </button>
          )}
        </div>
      </div>

      {/** Metric cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="text-amalfi h-8 w-8" />}
          label="ยอดเข้าถึง"
          value={campaign.reach.toLocaleString()}
          trend="+8%"
          caption="คนเห็นโฆษณาของคุณ"
        />
        <MetricCard
          icon={<MousePointerClick className="text-amalfi h-8 w-8" />}
          label="คลิก"
          value={campaign.clicks.toLocaleString()}
          trend="+2%"
          caption="คนที่สนใจและกดดูร้าน"
        />
        <MetricCard
          icon={<ShoppingCart className="text-amalfi h-8 w-8" />}
          label="ออเดอร์"
          value={campaign.orders.toLocaleString()}
          caption={`CPA ฿${campaign.cpa}`}
        />
        <MetricCard
          icon={<img src={cash} alt="" className="h-8 w-8" />}
          label="ยอดใช้จ่ายโฆษณา"
          value={`฿${campaign.adSpend.toLocaleString()}`}
          caption="ของงบรายเดือน"
        />
      </div>

      {/** Budget usage + ROI */}
      <div className="mt-6 flex flex-col gap-5 md:flex-row">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              การใช้งบประมาณ
            </h3>
            <p className="font-thai text-base text-black">
              <span className="font-bold">
                ฿{campaign.budgetSpent.toLocaleString()}
              </span>{' '}
              / ฿{campaign.budgetTotal.toLocaleString()} · ใช้ไปแล้ว {budgetPct}
              %
            </p>
          </div>
          <div className="mt-3 h-5.5 w-full rounded-xl bg-[rgba(142,152,168,0.5)] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <div
              className="bg-citrus h-5.5 rounded-xl shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="font-thai mt-2 flex flex-row justify-between text-base text-[#a6a6a6]">
            <span>วันละ ฿{campaign.dailyAvgSpend} เฉลี่ย</span>
            <span>เหลือเวลาอีก {campaign.daysRemaining} วัน</span>
          </div>
        </div>
        <div className="bg-amalfihover w-full rounded-xl p-5 text-white md:w-72 lg:w-96">
          <p className="font-thai text-xl">Return on Investment (ROI)</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{campaign.roi}x</p>
          <p className="font-thai mt-3 text-base">
            เทียบกับมาตรฐาน {campaign.roiBenchmark}x ในกลุ่มเดียวกัน
          </p>
        </div>
      </div>

      {/** AI insights */}
      <div className="border-seadark bg-sealight mt-6 rounded-xl border p-6">
        <h3 className="font-thai text-amalfidark mb-4 text-xl font-bold">
          น้องดี AI สรุปแคมเปญนี้ให้
        </h3>
        <div className="flex flex-col flex-wrap gap-4 sm:flex-row">
          {campaign.insights.map((insight, i) => (
            <div
              key={i}
              className="border-seadark flex min-w-40 flex-1 gap-2 rounded-xl border bg-white p-3 sm:min-w-55"
            >
              <span className="bg-sealight-active text-amalfidark flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base font-bold">
                {i + 1}
              </span>
              <p className="font-thai text-base text-black">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/** Charts */}
      <div className="mt-6 flex flex-col gap-5 md:flex-row">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-thai text-amalfidark text-2xl font-bold">
                แนวโน้มรายวัน
              </h3>
              <p className="font-thai text-base text-black">
                การเข้าถึง vs. งบที่ใช้
              </p>
            </div>
          </div>
          {campaign.dailyTrend.length > 0 ? (
            <TrendChart
              data={indexToFirst(campaign.dailyTrend, ['reach', 'spend'])}
              series={reachVsSpendSeries}
              valueFormatter={percentFormatter}
            />
          ) : (
            <p className="font-thai mt-6 text-center text-base text-[#8E98A8]">
              ยังไม่มีข้อมูลแนวโน้ม เนื่องจากแคมเปญยังไม่มีผลลัพธ์
            </p>
          )}
        </div>
        <div className="w-full rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] md:w-72 lg:w-96">
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            ช่องทางที่ทำงาน
          </h3>
          {campaign.channelReach.length > 0 ? (
            <DonutChart
              centerLabel="100%"
              centerSublabel="การเข้าถึง"
              segments={campaign.channelReach.map((c) => ({
                key: c.platform,
                label: platformBadgeStyles[c.platform].label,
                value: c.reach,
                color: platformBadgeStyles[c.platform].chartColor,
              }))}
            />
          ) : (
            <p className="font-thai mt-6 text-center text-base text-[#8E98A8]">
              ยังไม่มีข้อมูลช่องทาง
            </p>
          )}
        </div>
      </div>

      {/** Creatives */}
      <div className="mt-6 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              ครีเอทีฟที่กำลังทำงาน
            </h3>
            <p className="font-thai text-base text-black">
              AI ทดสอบ A/B/C อัตโนมัติ เพื่อหาว่าใบไหนได้ผลที่สุด
            </p>
          </div>
          <Link
            to={`/campaign/${campaign.id}/creative/new`}
            className="bg-seaactive font-thai hover:bg-seadark flex items-center gap-1 rounded-[15px] px-4 py-2 text-base text-white transition-all hover:scale-105 hover:cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            สร้างครีเอทีฟใหม่
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creatives.map((creative) => (
            <CreativeCard key={creative.rank} creative={creative} />
          ))}
          <Link
            to={`/campaign/${campaign.id}/creative/new`}
            className="font-thai flex h-69 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#8E98A8] bg-[rgba(142,152,168,0.1)] text-base text-[#8E98A8] hover:cursor-pointer hover:border-[#6B7280] hover:text-[#6B7280]"
          >
            <Plus className="h-6 w-6" />
            {creatives.length === 0 ? 'ยังไม่มีครีเอทีฟ · สร้างใหม่' : 'สร้างครีเอทีฟใหม่'}
          </Link>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CampaignReport
