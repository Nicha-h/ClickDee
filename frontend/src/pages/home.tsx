import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import coffee from '@/assets/icons/coffee.svg'
import rocket from '@/assets/icons/rocket.svg'
import ppl from '@/assets/icons/ppl.svg'
import increase from '@/assets/icons/increase.svg'
import star from '@/assets/icons/starcircle.svg'
import cash from '@/assets/icons/cash.svg'
import click from '@/assets/icons/click.svg'
import { ArrowRight, ChevronDown } from 'lucide-react'
import sparklebold from '@/assets/icons/sparklebold.svg'
import facebook from '@/assets/logos/facebook.svg'
import TrendChart from '@/components/trendChart'
import Sparkline from '@/components/sparkline'
import type { CampaignItem } from '@/data/campaigns'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import HomeSkeleton from '@/components/homeSkeleton'
import {
  getApiAuthAccountId,
  getApiAiRecommendations,
  getApiAiStatus,
  getApiCampaigns,
} from '@/api/generated/client'
import type { Recommendation } from '@/api/generated/client'
import { getUserId, withCredentials } from '@/lib/userId'
import {
  toCampaignItem,
  fetchCampaignThumbnail,
  fetchCampaignPerformance,
} from '@/lib/campaignAdapters'
import { isShowcaseAccount } from '@/lib/showcaseAccount'
import {
  buildSalesDataByRange,
  computeHalfOverHalfChangePct,
  SALES_COMPARISON_LABEL,
  type SalesRangeKey,
} from '@/lib/salesMockData'
import { Skeleton } from '@/components/skeleton'

const salesRangeOptions: { value: SalesRangeKey; label: string }[] = [
  { value: '7d', label: '7 วัน' },
  { value: 'monthly', label: 'รายเดือน' },
  { value: 'yearly', label: 'รายปี' },
]

const salesDataByRange = buildSalesDataByRange()

type RecommendationsState =
  | { status: 'loading' }
  | {
      status: 'loaded'
      hasCampaigns: boolean
      recommendations: Recommendation[]
    }

function RecommendationCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-[#8E98A8] px-5 py-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-2 h-5 w-full" />
      <Skeleton className="mt-5 h-8 w-28 rounded-full" />
    </div>
  )
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'สวัสดีตอนเช้า ☀️'
  if (hour >= 12 && hour < 17) return 'สวัสดีตอนบ่าย 🌤️'
  if (hour >= 17 && hour < 21) return 'สวัสดีตอนเย็น 🌇'
  return 'สวัสดีตอนดึก 🌙'
}

function Home() {
  const navigate = useNavigate()
  const isLoading = useSimulatedLoading()
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const isShowcase = isShowcaseAccount(email)
  const [runningCampaigns, setRunningCampaigns] = useState<
    CampaignItem[] | null
  >(null)
  const [totalCampaignCount, setTotalCampaignCount] = useState<number | null>(
    null,
  )
  const [recommendationsState, setRecommendationsState] =
    useState<RecommendationsState>({ status: 'loading' })
  const [aiStatus, setAiStatus] = useState<'loading' | 'active' | 'inactive'>(
    'loading',
  )
  {
    /** Summary data — real numbers/charts only shown for the admin810 showcase
     * account; every other user sees honest zeros/empty states below, since
     * there's no backend source for these metrics yet. */
  }
  const reach = isShowcase ? 12450 : 0
  const clickNum = isShowcase ? 842 : 0
  const usedBudget = isShowcase ? 12400 : 0
  const ROI = isShowcase ? 11.5 : 0
  const handleClick = () => {
    navigate('/campaign/new')
  }
  const localTrendPrompt =
    'เพิ่มลูกค้าใหม่ย่านสีลม-สาทร ที่กำลังค้นหาคาเฟ่ใกล้ฉัน งบ 300 บาท/วัน'
  const [salesRange, setSalesRange] = useState(salesRangeOptions[0])
  const [isSalesRangeOpen, setIsSalesRangeOpen] = useState(false)
  const salesRangeRef = useRef<HTMLDivElement>(null)
  const salesData = useMemo(
    () => salesDataByRange[salesRange.value],
    [salesRange.value],
  )
  const salesChangePct = useMemo(
    () => computeHalfOverHalfChangePct(salesData),
    [salesData],
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        salesRangeRef.current &&
        !salesRangeRef.current.contains(event.target as Node)
      ) {
        setIsSalesRangeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    getApiAuthAccountId(userId, withCredentials()).then((res) => {
      if (res.status === 200) {
        setBusinessName(res.data.businessName)
        setEmail(res.data.email)
      }
    })
  }, [])

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    getApiCampaigns(withCredentials()).then((res) => {
      if (res.status !== 200) return
      setTotalCampaignCount(res.data.length)
      const running = res.data
        .map(toCampaignItem)
        .filter((c) => c.status === 'active' || c.status === 'paused')
        .sort((a, b) =>
          a.status === b.status ? 0 : a.status === 'active' ? -1 : 1,
        )
        .slice(0, 2)
      setRunningCampaigns(running)
      running.forEach((item) => {
        fetchCampaignThumbnail(item.id).then((url) => {
          if (!url) return
          setRunningCampaigns((prev) =>
            prev
              ? prev.map((c) =>
                  c.id === item.id ? { ...c, thumbnail: url } : c,
                )
              : prev,
          )
        })
        if (!item.meta?.campaignId) return
        fetchCampaignPerformance(item.id).then(({ dailyTrend, roi }) => {
          if (dailyTrend.length === 0 && roi === null) return
          setRunningCampaigns((prev) =>
            prev
              ? prev.map((c) =>
                  c.id === item.id
                    ? {
                        ...c,
                        ...(dailyTrend.length > 0 && { dailyTrend }),
                        ...(roi !== null && { roi }),
                      }
                    : c,
                )
              : prev,
          )
        })
      })
    })
  }, [])

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    getApiAiRecommendations(withCredentials()).then((res) => {
      if (res.status === 200) {
        setRecommendationsState({
          status: 'loaded',
          hasCampaigns: res.data.hasCampaigns,
          recommendations: res.data.recommendations,
        })
      }
    })
  }, [])

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    getApiAiStatus(withCredentials()).then((res) => {
      if (res.status === 200) setAiStatus(res.data.status)
    })
  }, [])

  const showRecommendations =
    recommendationsState.status === 'loading' ||
    recommendationsState.hasCampaigns
  const cardsToRender: Recommendation[] =
    recommendationsState.status === 'loaded'
      ? recommendationsState.recommendations
      : []

  if (isLoading) return <HomeSkeleton />

  return (
    <div className="min-h-full w-full py-10">
      {/** Welcome Message + create campaign btn*/}
      <div className="flex w-full max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div className="font-thai flex flex-col items-start justify-start gap-2 font-semibold">
          <div className="text-amalfidark text-2xl sm:text-3xl lg:text-4xl">
            {getTimeGreeting()}{' '}
            {businessName ? `ทีม${businessName}` : 'ทีมของคุณ'}!
          </div>
          <div className="text-xl">
            วันนี้ AI ดูแลโฆษณาให้คุณอยู่นะ
            ระบบกำลังทำงานอย่างเต็มที่เพื่อยอดขายของคุณ
          </div>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <button
            onClick={() => handleClick()}
            className="bg-citrus hover:bg-citrushover font-thai w-full rounded-[19px] px-12 py-6 text-2xl font-semibold text-black shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg sm:w-auto"
          >
            <img
              src={rocket}
              alt="Rocket"
              className="mr-4 -ml-2 inline-block h-10 w-10 brightness-0"
            />
            สร้างแคมเปญใหม่
          </button>
        </div>
      </div>
      {/** AI status box*/}
      <div className="bg-sealight border-seadark mt-10 flex w-full max-w-7xl flex-col items-start justify-between gap-6 rounded-xl border-2 px-6 py-6 shadow-md sm:h-60 sm:flex-row sm:items-center sm:px-15 sm:py-0">
        <div className="flex flex-1 flex-col gap-4">
          {/** AI Agent Status + time update */}
          <div className="font-thai -mt-4 flex w-full flex-row flex-wrap items-center justify-start gap-2 font-semibold">
            {aiStatus === 'inactive' ? (
              <div className="mt-2 flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1 text-xs whitespace-nowrap text-[#6B7280] sm:px-4 sm:py-2 sm:text-sm lg:text-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8E98A8]"></span>
                </span>
                AI Agent · ไม่พร้อมใช้งาน
              </div>
            ) : (
              <div className="text-amalfi mt-2 flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1 text-xs whitespace-nowrap sm:px-4 sm:py-2 sm:text-sm lg:text-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                </span>
                AI Agent · กำลังทำงาน
              </div>
            )}
            {isShowcase && (
              <h2 className="mt-3 text-xs sm:ml-5 md:text-sm lg:text-base">
                อัปเดทล่าสุด 2 ชั่วโมงที่แล้ว
              </h2>
            )}
          </div>
          {/** filler msg*/}
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="font-thai text-amalfidark text-2xl font-semibold">
              {aiStatus === 'inactive'
                ? 'AI ยังไม่พร้อมใช้งานในขณะนี้'
                : 'วันนี้ น้องดีดูแลโฆษณาให้คุณอยู่นะคะ ☕'}
            </div>
            <div className="font-thai text-amalfi text-lg">
              {aiStatus === 'inactive'
                ? 'ระบบ AI ยังไม่ได้ตั้งค่าไว้ — ฟีเจอร์ที่เกี่ยวกับ AI จะยังใช้งานไม่ได้ในตอนนี้'
                : 'ระบบกำลังทำงานเต็มที่เพื่อยอดขายของคุณ — วิเคราะห์ตลาด ปรับงบ และเขียนโฆษณาให้อัตโนมัติ แค่คลิกเดียว ก็สร้างแคมเปญใหม่ได้เลย'}
            </div>
          </div>
        </div>
        {/** coffee cup */}
        <div className="shrink-0 self-center sm:ml-26">
          <img src={coffee} alt="Coffee" className="h-40 w-40" />
        </div>
      </div>
      {/** summary boxes*/}
      {/** TODO: Replace placeholder data with real-time metrics. Replace values with a variable instead of texts*/}
      <div className="mt-10 grid w-full max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row p-4 text-2xl font-semibold">
            <img src={ppl} alt="People" className="mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi font-semibold">ยอดเข้าถึง</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
              {reach.toLocaleString()}
            </p>
            {isShowcase && (
              <div className="ml-4 flex flex-row items-center justify-start gap-2">
                <img
                  src={increase}
                  alt="Increase"
                  className="inline-block h-6 w-6"
                />
                <span className="font-thai text-citrusdark text-lg font-semibold">
                  +8%
                </span>
              </div>
            )}
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-black">
              คนเห็นโฆษณาของคุณ
            </p>
          </div>
        </div>
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row p-4 text-2xl font-semibold">
            <img
              src={click}
              alt="click"
              className="mr-2 inline-block h-9 w-9"
            />
            <h2 className="font-thai text-amalfi font-semibold">คลิก</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
              {clickNum.toLocaleString()}
            </p>
            {isShowcase && (
              <div className="ml-4 flex flex-row items-center justify-start gap-2">
                <img
                  src={increase}
                  alt="Increase"
                  className="inline-block h-6 w-6"
                />
                <span className="font-thai text-citrusdark text-lg font-semibold">
                  +12%
                </span>
              </div>
            )}
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-black">
              คนที่สนใจและกดดูร้าน
            </p>
          </div>
        </div>
        <div className="h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row p-4 text-2xl font-semibold">
            <img
              src={cash}
              alt="Budget usage"
              className="mr-2 inline-block h-9 w-9"
            />
            <h2 className="font-thai text-amalfi font-semibold">
              ยอดใช้จ่ายโฆษณา
            </h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
              ฿{usedBudget.toLocaleString()}
            </p>
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-black">
              ของงบรายเดือน
            </p>
          </div>
        </div>
        <div className="bg-amalfi h-full min-h-45 w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai flex flex-row justify-between p-4 text-2xl font-semibold text-white">
            <h2 className="font-thai font-semibold">ROI</h2>
            <img
              src={star}
              alt="Budget usage"
              className="mr-2 inline-block h-9 w-9"
            />
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-2xl font-bold text-white sm:text-3xl">
              {ROI.toFixed(1)}x
            </p>
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-white">
              ผลตอบแทนดีเยี่ยม
            </p>
          </div>
        </div>
      </div>
      {/** Campaign boxes + sales overview + connected channels (left) / AI recommendations + local trend (right) */}
      <div className="mt-10 flex flex-col items-start gap-5 md:flex-row">
        {/** Left column */}
        <div className="flex w-full flex-col gap-8 md:w-[60%] lg:w-3xl">
          <div className="flex w-full flex-col">
            <div className="font-thai flex flex-row items-center justify-between gap-2 p-4 text-2xl font-semibold">
              <h2 className="font-thai text-amalfidark text-xl font-semibold sm:text-2xl lg:text-3xl">
                โฆษณาที่กำลังรันอยู่
              </h2>
              <NavLink
                to="/campaign"
                className="font-thai text-seadark hover:text-seadark text-lg font-semibold"
              >
                ดูทั้งหมด
                <ArrowRight className="-mt-1 ml-2 inline-block h-6 w-6" />
              </NavLink>
            </div>
            {runningCampaigns === null ? (
              <div className="flex h-auto w-full flex-row items-center justify-start rounded-xl border-2 border-[#8E98A8] px-4 py-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30 sm:px-6">
                <Skeleton className="h-15 w-15 shrink-0 rounded-2xl" />
                <div className="flex min-w-0 flex-col gap-2 px-4">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ) : runningCampaigns.length === 0 ? (
              <div className="flex h-auto w-full flex-col items-start gap-3 rounded-xl border-2 border-[#8E98A8] px-6 py-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
                <p className="font-thai text-lg text-black">
                  ยังไม่มีแคมเปญที่กำลังทำงาน
                </p>
                <NavLink
                  to="/campaign/new"
                  className="bg-citrus hover:bg-citrushover font-thai rounded-full px-5 py-2 text-base font-semibold text-black transition-all hover:cursor-pointer"
                >
                  สร้างแคมเปญใหม่
                </NavLink>
              </div>
            ) : (
              runningCampaigns.map((campaign, i) => (
                <div
                  key={campaign.id}
                  className={`items-between flex h-auto w-full flex-row justify-start rounded-xl border-2 border-[#8E98A8] px-4 py-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30 sm:px-6 ${i > 0 ? 'mt-5' : ''}`}
                >
                  <img
                    src={campaign.thumbnail}
                    alt={campaign.title}
                    className="h-15 w-15 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="flex min-w-0 flex-col px-4">
                    <h2 className="font-thai truncate text-2xl font-semibold text-black">
                      {campaign.title}
                    </h2>
                    <h3 className="font-thai text-citrusdark text-lg font-semibold">
                      ROI {campaign.roi.toFixed(1)}x
                    </h3>
                  </div>
                  <div className="ml-auto hidden flex-row items-center justify-end sm:flex">
                    <Sparkline
                      data={campaign.dailyTrend.map((d) => ({
                        label: d.date,
                        value: d.reach,
                      }))}
                      label="ยอดเข้าถึงรายวัน"
                      className="h-19 w-50"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/** Sales overview */}
          <div className="w-full rounded-xl border-2 border-[#8E98A8] px-10 py-6 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <div className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-thai text-amalfidark text-2xl font-semibold">
                  ภาพรวมยอดขาย
                </h2>
                {isShowcase && (
                  <p className="font-thai mt-1 text-lg text-[#8E98A8]">
                    {SALES_COMPARISON_LABEL[salesRange.value]}{' '}
                    <span
                      className={`font-semibold ${salesChangePct >= 0 ? 'text-[#519b5c]' : 'text-[#d64545]'}`}
                    >
                      {salesChangePct >= 0 ? '+' : ''}
                      {salesChangePct.toFixed(1)}%
                    </span>
                  </p>
                )}
              </div>
              <div className="relative" ref={salesRangeRef}>
                <button
                  onClick={() => setIsSalesRangeOpen((prev) => !prev)}
                  className="font-thai border-amalfi bg-amalfilight hover:bg-amalfilight-hover flex items-center gap-1 rounded-full border px-4 py-1 text-base text-black transition-all duration-200 ease-in-out hover:cursor-pointer"
                >
                  {salesRange.label}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isSalesRangeOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-32 rounded-xl border border-[#8E98A8] bg-white py-1 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
                    {salesRangeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSalesRange(option)
                          setIsSalesRangeOpen(false)
                        }}
                        className={`font-thai block w-full px-4 py-1.5 text-left text-sm hover:bg-[#f5f5f5] ${option.value === salesRange.value ? 'text-amalfi font-semibold' : 'text-black'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isShowcase ? (
              <TrendChart
                key={salesRange.value}
                data={salesData}
                series={[{ key: 'sales', label: 'ยอดขาย', color: '#1E59BC' }]}
                valueFormatter={(v) => `฿${v.toLocaleString()}`}
              />
            ) : (
              <p className="font-thai mt-6 py-10 text-center text-base text-[#8E98A8]">
                ยังไม่มีข้อมูลยอดขายตอนนี้
              </p>
            )}
          </div>

          {/** Connected channels */}
          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <h2 className="font-thai text-amalfidark text-2xl font-semibold">
              ช่องทางที่เชื่อมต่อ
            </h2>
            <p className="font-thai mt-1 text-base text-black">
              ClickDee ส่งโฆษณาออกไปยังแพลตฟอร์มเหล่านี้ให้คุณอัตโนมัติ
            </p>
            <div className="mt-4 flex w-full flex-row items-center gap-3 rounded-[10px] border border-[#8E98A8] p-4 sm:w-58">
              <img
                src={facebook}
                alt="Facebook"
                className="h-11 w-11 rounded-xl"
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-thai text-lg font-bold text-black">
                    Facebook
                  </p>
                  {isShowcase ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    </span>
                  ) : (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#8E98A8]"></span>
                    </span>
                  )}
                </div>
                <p className="font-thai text-base text-[#787878]">
                  {isShowcase
                    ? '12 แคมเปญ'
                    : `ยังไม่ได้เชื่อมต่อ${totalCampaignCount ? ` · ${totalCampaignCount} แคมเปญ` : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/** Right column */}
        <div className="flex w-full flex-col gap-5 md:w-[40%] lg:w-150">
          {/** AI recommendations*/}
          {showRecommendations && (
            <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
              <div className="flex flex-row items-center gap-3">
                <div className="bg-citrus rounded-xl p-3 shadow-md">
                  <img src={sparklebold} alt="Sparkle" className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="font-thai text-amalfidark text-2xl font-semibold">
                    น้องดีแนะนำให้คุณ
                  </h2>
                  {recommendationsState.status === 'loading' ? (
                    <Skeleton className="mt-1 h-5 w-40" />
                  ) : (
                    <p className="font-thai text-base text-black">
                      {cardsToRender.length} สิ่งที่ทำได้ใน 30 วินาที
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {recommendationsState.status === 'loading' ? (
                  <>
                    <RecommendationCardSkeleton />
                    <RecommendationCardSkeleton />
                  </>
                ) : cardsToRender.length === 0 ? (
                  <p className="font-thai text-base text-[#8E98A8]">
                    ยังไม่มีคำแนะนำตอนนี้ ลองใหม่อีกครั้งภายหลัง
                  </p>
                ) : (
                  cardsToRender.map((rec, i) => (
                    <div
                      key={`${rec.campaignId}-${i}`}
                      className="rounded-[10px] border border-[#8E98A8] px-5 py-4"
                    >
                      <p className="font-thai text-xl font-semibold text-black">
                        {rec.title}
                      </p>
                      <p className="font-thai mt-1 text-base text-black">
                        {rec.description}
                      </p>
                      <button
                        onClick={() => navigate('/campaign')}
                        className="bg-sealight-hover border-seadark text-seadark font-thai hover:bg-sealight-active mt-5 flex items-center gap-1 rounded-full border px-7 py-1 text-base transition-colors hover:cursor-pointer"
                      >
                        {rec.actionLabel}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/** Local trend */}
          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 pb-8 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <p className="font-thai text-xl font-semibold text-black">
              เทรนด์ในย่านของคุณ
            </p>
            {isShowcase ? (
              <>
                <p className="font-thai text-amalfidark mt-2 text-lg font-bold italic">
                  ลูกค้าในเขตสีลม-สาทร ค้นหาคำว่า "คาเฟ่ใกล้ฉัน" เพิ่มขึ้น +47%
                  สัปดาห์นี้
                </p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() =>
                      navigate('/campaign/new', {
                        state: { prompt: localTrendPrompt },
                      })
                    }
                    className="bg-seadark font-thai hover:bg-seadark-hover mt-3 flex h-12 w-36 items-center gap-1 rounded-full px-7 py-1 text-xl text-white transition-colors hover:cursor-pointer"
                  >
                    คว้าโอกาส
                  </button>
                </div>
              </>
            ) : (
              <p className="font-thai mt-2 text-base text-[#8E98A8]">
                ยังไม่มีข้อมูลเทรนด์ในพื้นที่ตอนนี้
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default Home
