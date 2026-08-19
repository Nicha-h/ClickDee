import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import {
  ShoppingCart,
  Search,
  Clock,
  ChevronRight,
  Pause,
  Play,
  Pencil,
} from 'lucide-react'
import rocket from '@/assets/icons/rocket.svg'
import cash from '@/assets/icons/cash.svg'
import starcircle from '@/assets/icons/starcircle.svg'
import sparklebold from '@/assets/icons/sparklebold.svg'
import aiMascot from '@/assets/placeholders/ai-mascot.png'
import { campaigns as mockCampaigns, platformBadgeStyles } from '@/data/campaigns'
import type { CampaignItem, CampaignStatus } from '@/data/campaigns'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import CampaignSkeleton from '@/components/campaignSkeleton'
import Sparkline from '@/components/sparkline'
import { getApiCampaigns } from '@/api/generated/client'
import type { Campaign as ApiCampaign } from '@/api/generated/client'
import { getUserId, withCredentials } from '@/lib/userId'

{
  /** Summary data PLACEHOLDER*/
}
const activeCampaigns = 3
const totalCampaigns = 6
const totalSpend = 19694
const totalBudget = 32500
const remainingBudget = 12806
const totalOrders = 2462
const ordersDelta = 184
const roi = 11.5

const aiSuggestionPrompt =
  'สร้างแคมเปญ "เครื่องดื่มร้อนช่วงฝนตก" ฝนกำลังจะตกใน 3 วันข้างหน้า งบเริ่มต้น 200 บาท/วัน'

type FilterTab = { key: string; label: string; count: number }

function buildFilterTabs(items: CampaignItem[]): FilterTab[] {
  return [
    { key: 'all', label: 'ทั้งหมด', count: items.length },
    {
      key: 'active',
      label: 'กำลังทำงาน',
      count: items.filter((c) => c.status === 'active').length,
    },
    {
      key: 'paused',
      label: 'หยุดชั่วคราว',
      count: items.filter((c) => c.status === 'paused').length,
    },
    {
      key: 'draft',
      label: 'ฉบับร่าง',
      count: items.filter((c) => c.status === 'draft').length,
    },
    {
      key: 'ended',
      label: 'สิ้นสุดแล้ว',
      count: items.filter((c) => c.status === 'ended').length,
    },
  ]
}

const statusBadgeStyles: Record<
  CampaignItem['status'],
  { bg: string; textColor: string; dotColor: string; label: string }
> = {
  active: {
    bg: 'bg-[#caf3d0]',
    textColor: 'text-[#519b5c]',
    dotColor: 'bg-[#519b5c]',
    label: 'กำลังทำงาน',
  },
  paused: {
    bg: 'bg-citrus-light-active',
    textColor: 'text-citrusdark',
    dotColor: 'bg-citrusdark',
    label: 'หยุดชั่วคราว',
  },
  draft: {
    bg: 'bg-sealight',
    textColor: 'text-seadark-active',
    dotColor: 'bg-seadark-active',
    label: 'ฉบับร่าง',
  },
  ended: {
    bg: 'bg-[#E5E7EB]',
    textColor: 'text-[#6B7280]',
    dotColor: 'bg-[#6B7280]',
    label: 'สิ้นสุดแล้ว',
  },
}

// The real Campaign model only has name/status/budget/dates — none of the
// performance fields below exist server-side yet, so they default to
// empty/zero rather than being a bug specific to this adapter.
const API_STATUS_MAP: Record<ApiCampaign['status'], CampaignStatus> = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DRAFT: 'draft',
  COMPLETED: 'ended',
}

function toCampaignItem(campaign: ApiCampaign): CampaignItem {
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

const STATUS_SORT_PRIORITY: Record<CampaignStatus, number> = {
  active: 0,
  paused: 1,
  draft: 2,
  ended: 3,
}

function compareCampaigns(a: CampaignItem, b: CampaignItem): number {
  const statusDiff =
    STATUS_SORT_PRIORITY[a.status] - STATUS_SORT_PRIORITY[b.status]
  if (statusDiff !== 0) return statusDiff
  return a.daysRemaining - b.daysRemaining
}

function CampaignCard({ campaign }: { campaign: CampaignItem }) {
  const statusBadge = statusBadgeStyles[campaign.status]
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#8E98A8] lg:shrink-0 lg:flex-row">
      <img
        src={campaign.thumbnail}
        alt={campaign.title}
        className="h-48 w-full shrink-0 rounded-t-xl object-cover lg:h-62 lg:w-40 lg:rounded-tl-xl lg:rounded-tr-none lg:rounded-bl-xl"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-row flex-wrap items-start justify-between gap-2">
          <h3 className="font-thai text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
            {campaign.title}
          </h3>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span
              className={`font-thai flex items-center gap-1 rounded-full px-3 py-1 text-base font-medium ${statusBadge.bg} ${statusBadge.textColor}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${statusBadge.dotColor}`}
              />
              {statusBadge.label}
            </span>
            {campaign.status !== 'ended' &&
              Number.isFinite(campaign.daysRemaining) && (
                <span className="font-thai text-citrusdark flex items-center gap-1 text-lg font-medium">
                  <Clock className="h-4 w-4" />
                  เหลือ {campaign.daysRemaining} วัน
                </span>
              )}
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-3">
          <p className="font-thai text-lg font-bold text-black">
            {campaign.goal}
          </p>
          <div className="flex flex-row flex-wrap gap-2">
            {campaign.platforms.map((platform) => {
              const badge = platformBadgeStyles[platform]
              return (
                <span
                  key={platform}
                  className={`inline-flex items-center gap-1 rounded-full px-6 py-2 text-base font-medium ${badge.bg} ${badge.textColor}`}
                >
                  <img src={badge.icon} alt="" className="h-5 w-5" />
                  {badge.label}
                </span>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid flex-1 grid-cols-2 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                ยอดเข้าถึง
              </p>
              <p className="text-2xl font-bold text-black">
                {campaign.reach.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                คลิก
              </p>
              <p className="text-2xl font-bold text-black">
                {campaign.clicks.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                ออเดอร์
              </p>
              <p className="text-2xl font-bold text-black">
                {campaign.orders.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                CPA
              </p>
              <p className="text-2xl font-bold text-black">฿{campaign.cpa}</p>
            </div>
            <div>
              <p className="font-thai text-amalfidark text-base font-bold">
                ROI
              </p>
              <p className="text-2xl font-bold text-[#519b5c]">
                {campaign.roi}x
              </p>
            </div>
          </div>
          <Sparkline
            data={campaign.dailyTrend.map((d) => ({
              label: d.date,
              value: d.reach,
            }))}
            label="ยอดเข้าถึงรายวัน"
            className="hidden h-30 w-51 shrink-0 sm:block"
          />
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-row items-center justify-between gap-4 border-t border-[#D9D9D9] p-5 lg:w-45 lg:flex-col lg:items-end lg:justify-between lg:border-t-0 lg:border-l">
        <Link
          to={`/campaign/${campaign.id}/report`}
          className="border-seadark bg-sealight-hover font-thai text-seadark-hover hover:bg-sealight-active flex items-center gap-1 rounded-[19px] border px-4 py-2 text-base font-semibold"
        >
          ดูรายงาน
          <ChevronRight className="h-4 w-4" />
        </Link>
        <div className="flex flex-row flex-wrap items-center gap-4 lg:flex-col lg:items-end">
          {campaign.source === 'api' ? (
            <p className="font-thai max-w-40 text-right text-sm text-[#8E98A8]">
              จัดการแคมเปญนี้จะเปิดใช้งานเร็วๆ นี้
            </p>
          ) : (
            <>
              {campaign.status === 'active' && (
                <button className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold">
                  <Pause className="h-5 w-5" />
                  หยุดชั่วคราว
                </button>
              )}
              {campaign.status === 'paused' && (
                <button className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold">
                  <Play className="h-5 w-5" />
                  เริ่มแคมเปญ
                </button>
              )}
              <Link
                to={`/campaign/${campaign.id}/edit`}
                className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold"
              >
                <Pencil className="h-5 w-5" />
                แก้ไข
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Campaign() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [userId] = useState(() => getUserId())
  const [apiCampaigns, setApiCampaigns] = useState<CampaignItem[]>([])
  const isLoading = useSimulatedLoading()
  const [filterTabsRef] = useEmblaCarousel({
    axis: 'x',
    dragFree: true,
    containScroll: 'trimSnaps',
  })

  useEffect(() => {
    if (!userId) return
    getApiCampaigns(withCredentials()).then((res) => {
      if (res.status === 200) {
        setApiCampaigns(res.data.map(toCampaignItem))
      }
    })
  }, [userId])

  if (isLoading) return <CampaignSkeleton />

  const allCampaigns = [...mockCampaigns, ...apiCampaigns].sort(
    compareCampaigns,
  )
  const filterTabs = buildFilterTabs(allCampaigns)

  const filteredCampaigns = allCampaigns.filter((campaign) => {
    const matchesStatus =
      activeFilter === 'all' || campaign.status === activeFilter
    const matchesSearch = campaign.title
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="font-thai flex flex-col gap-2 font-semibold">
        <h1 className="text-amalfidark text-2xl font-semibold sm:text-3xl lg:text-4xl">
          แคมเปญของฉัน
        </h1>
        <p className="text-lg font-semibold text-black">
          จัดการโฆษณาทั้งหมดของคุณ — AI ดูแลการเสนอราคา จัดสรรงบ
          และเพิ่มประสิทธิภาพให้อัตโนมัติ
        </p>
      </div>

      {/** Create campaign button */}
      <div className="mt-6">
        <button
          onClick={() => navigate('/campaign/new')}
          className="bg-citrus font-thai hover:bg-citrushover w-full rounded-[19px] px-12 py-6 text-2xl font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg sm:w-auto"
        >
          <img
            src={rocket}
            alt="Rocket"
            className="mr-3 -ml-2 inline-block h-8 w-8 brightness-0"
          />
          สร้างโฆษณาใหม่
        </button>
      </div>

      {/** Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <img
              src={rocket}
              alt="Campaigns"
              className="mr-2 inline-block h-9 w-9 brightness-0"
            />
            <h2 className="font-thai text-amalfi text-2xl font-semibold">
              แคมเปญที่กำลังทำงาน
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-2xl font-bold sm:text-3xl">
            {activeCampaigns}
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-black">
            จาก {totalCampaigns} แคมเปญทั้งหมด
          </p>
        </div>
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <img src={cash} alt="Spend" className="mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi text-2xl font-semibold">
              ใช้จ่ายรวมเดือนนี้
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-2xl font-bold sm:text-3xl">
            ฿{totalSpend.toLocaleString()}
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-black">
            งบ ฿{totalBudget.toLocaleString()} · เหลือ ฿
            {remainingBudget.toLocaleString()}
          </p>
        </div>
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <ShoppingCart className="text-amalfi mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi text-2xl font-semibold">
              ออเดอร์รวม
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-2xl font-bold sm:text-3xl">
            {totalOrders.toLocaleString()}
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-black">
            +{ordersDelta} จากเมื่อวาน
          </p>
        </div>
        <div className="bg-amalfi h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row justify-between p-4">
            <h2 className="font-thai text-2xl font-semibold text-white">ROI</h2>
            <img src={starcircle} alt="ROI" className="inline-block h-9 w-9" />
          </div>
          <p className="px-4 text-2xl font-bold text-white sm:text-3xl">
            {roi.toFixed(1)}x
          </p>
          <p className="font-thai mt-2 px-4 text-lg font-semibold text-white">
            ผลตอบแทนดีเยี่ยม
          </p>
        </div>
      </div>

      {/** Filter tabs + search */}
      <div
        ref={filterTabsRef}
        className="mt-8 cursor-grab overflow-hidden active:cursor-grabbing"
      >
        <div className="flex flex-row items-center gap-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`font-thai shrink-0 rounded-[19px] px-5 py-2 text-base font-semibold transition-colors ${
                activeFilter === tab.key
                  ? 'bg-seaactive hover:bg-seadark-hover text-white'
                  : 'bg-sealight-active text-seadark-hover hover:bg-sea'
              } transition-all hover:cursor-pointer hover:shadow-md`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>
      <div className="border-seadark mt-4 flex w-full flex-row items-center justify-around gap-2 rounded-[19px] border-2 px-4 py-2">
        <Search className="text-seadark h-5 w-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาแคมเปญ..."
          className="font-thai flex-1 text-lg outline-none"
        />
      </div>

      {/** Campaign list */}
      <div className="mt-8 flex flex-col gap-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        ) : (
          <p className="font-thai py-10 text-center text-lg text-black">
            ไม่พบแคมเปญที่ตรงกับตัวกรอง
          </p>
        )}
      </div>

      {/** AI suggestion banner */}
      <div className="border-seadark bg-sealight mt-8 flex flex-col items-start gap-4 rounded-[10px] border p-6 sm:flex-row">
        <div className="bg-citrus rounded-xl p-4 shadow-md">
          <img src={sparklebold} alt="Sparkle" className="h-8 w-8" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="font-thai text-amalfidark text-lg font-semibold">
            น้องดี AI แนะนำ
          </p>
          <p className="font-thai text-amalfi text-xl font-bold">
            ฝนกำลังจะตกใน 3 วันข้างหน้า — สร้างแคมเปญ
            &quot;เครื่องดื่มร้อนช่วงฝนตก&quot; เพื่อใช้โอกาสนี้
          </p>
          <p className="font-thai text-sm text-black">
            คาดการณ์: เพิ่มออเดอร์ 18–24% · งบเริ่มต้น ฿200/วัน · ใช้เวลาสร้าง
            30 วินาที
          </p>
        </div>

        <button
          onClick={() =>
            navigate('/campaign/new', { state: { prompt: aiSuggestionPrompt } })
          }
          className="bg-amalfihover font-thai hover:bg-amalfiactive flex shrink-0 items-center gap-1 rounded-[19px] px-6 py-2 text-lg font-semibold text-white transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg"
        >
          สร้างเลย
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default Campaign
