import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ppl from '@/assets/icons/ppl.svg'
import click from '@/assets/icons/click.svg'
import cash from '@/assets/icons/cash.svg'
import increase from '@/assets/icons/increase.svg'
import starcircle from '@/assets/icons/starcircle.svg'
import DonutChart from '@/components/donutChart'
import TrendChart from '@/components/trendChart'
import {
  indexToFirst,
  reachVsSpendSeries,
  percentFormatter,
} from '@/components/trendChartUtils'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import OverviewSkeleton from '@/components/overviewSkeleton'

{
  /** Summary data PLACEHOLDER*/
}
const reach = 12450
const clickNum = 842
const usedBudget = 12400
const ROI = 11.5

const channelReach = [
  { key: 'facebook', label: 'Facebook', value: 5220, color: '#1877F2' },
]

const dailyTrendRaw = [
  { date: '5 พ.ค.', reach: 1420, spend: 1400 },
  { date: '6 พ.ค.', reach: 1550, spend: 1500 },
  { date: '7 พ.ค.', reach: 1680, spend: 1650 },
  { date: '8 พ.ค.', reach: 1610, spend: 1750 },
  { date: '9 พ.ค.', reach: 1890, spend: 1800 },
  { date: '10 พ.ค.', reach: 2050, spend: 1950 },
  { date: '11 พ.ค.', reach: 2250, spend: 2350 },
]
const dailyTrendIndexed = indexToFirst(dailyTrendRaw, ['reach', 'spend'])

const audienceSegments = [
  { key: '18-24', label: '18–24 ปี', value: 2890, color: '#77BAFF' },
  { key: '25-34', label: '25–34 ปี', value: 5340, color: '#1E59BC' },
  { key: '35-44', label: '35–44 ปี', value: 2960, color: '#FED717' },
  { key: '45+', label: '45 ปีขึ้นไป', value: 1260, color: '#A481F9' },
]

type DateRange = { key: string; label: string }

const dateRanges: DateRange[] = [
  { key: 'today', label: 'วันนี้' },
  { key: 'week', label: 'สัปดาห์นี้' },
  { key: 'month', label: 'เดือนนี้' },
  { key: '90days', label: '90 วัน' },
]

{
  /** Subtitle text per range, PLACEHOLDER*/
}
const rangeSubtitles: Record<string, string> = {
  today: 'วันนี้',
  week: 'สัปดาห์นี้ (5 – 11 พ.ค.)',
  month: 'เดือนนี้ (1 – 31 พ.ค.)',
  '90days': '90 วันที่ผ่านมา',
}

{
  /** AI insights PLACEHOLDER*/
}
const aiInsights = [
  'วันศุกร์ ROI พุ่งสูงสุด +34% — แนะนำให้ขยับงบไปเสาร์-อาทิตย์เพิ่ม',
  'ครีเอทีฟ #3 ของแคมเปญลาเต้คาราเมลคลิกต่ำกว่าค่าเฉลี่ย 26% ลองสลับภาพใหม่',
  'กลุ่มอายุ 25–34 มี Conversion Rate สูงกว่ากลุ่มอื่น 2.1 เท่า',
]

{
  /** Top-performing campaigns PLACEHOLDER*/
}
const topCampaigns = [
  {
    rank: 1,
    badgeClass: 'bg-citrus text-black',
    name: 'โปรไมโล 2026 ลด 60%',
    reach: 6420,
    orders: 842,
    roi: 18.2,
  },
  {
    rank: 2,
    badgeClass: 'bg-[#d9d9d9] text-black',
    name: 'โปรหน้าฝน 2026 ลด 20%',
    reach: 4120,
    orders: 312,
    roi: 11.5,
  },
  {
    rank: 3,
    badgeClass: 'bg-[#e5c29a] text-black',
    name: 'วันแม่ ส่งฟรีทั่วประเทศ',
    reach: 1910,
    orders: 198,
    roi: 9.3,
  },
]

function Overview() {
  const [activeRange, setActiveRange] = useState('week')
  const isLoading = useSimulatedLoading()

  if (isLoading) return <OverviewSkeleton />

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="font-thai flex flex-col gap-1 font-semibold">
        <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
          รายงานผลสรุป
        </h1>
        <p className="text-lg font-bold text-black">
          ภาพรวมประสิทธิภาพแคมเปญทั้งหมด · {rangeSubtitles[activeRange]}
        </p>
      </div>

      {/** Date range filter */}
      {/* TODO: wire up real date-range filtering once analytics data is available */}
      <div className="mt-4 flex flex-row items-center gap-2 overflow-x-auto">
        {dateRanges.map((range) => (
          <button
            key={range.key}
            onClick={() => setActiveRange(range.key)}
            className={`font-thai shrink-0 rounded-[15px] px-5 py-1 text-lg transition-colors ${
              activeRange === range.key
                ? 'bg-seadark-hover text-white'
                : 'bg-sealight-active text-seadark-hover hover:bg-sealight-hover'
            } *:transition-all hover:scale-105 hover:cursor-pointer`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/** Stat cards */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="w-full rounded-xl border-2 border-[#8E98A8] px-4 py-1 pb-4 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row items-center p-4 text-xl font-semibold">
            <img src={ppl} alt="People" className="mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi font-semibold">ยอดเข้าถึง</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
              {reach.toLocaleString()}
            </p>
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
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-black">
              คนเห็นโฆษณาของคุณ
            </p>
          </div>
        </div>
        <div className="w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row items-center p-4 text-xl font-semibold">
            <img
              src={click}
              alt="Click"
              className="mr-2 inline-block h-9 w-9"
            />
            <h2 className="font-thai text-amalfi font-semibold">คลิก</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-2xl font-bold sm:text-3xl">
              {clickNum.toLocaleString()}
            </p>
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
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-black">
              คนที่สนใจและกดดูร้าน
            </p>
          </div>
        </div>
        <div className="w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row items-center p-4 text-xl font-semibold">
            <img
              src={cash}
              alt="Ad spend"
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
        <div className="bg-amalfi w-full rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai flex flex-row items-center justify-between p-4 text-xl font-semibold text-white">
            <h2 className="font-thai font-semibold">ROI</h2>
            <img src={starcircle} alt="ROI" className="inline-block h-9 w-9" />
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
          <TrendChart
            data={dailyTrendIndexed}
            series={reachVsSpendSeries}
            valueFormatter={percentFormatter}
          />
        </div>
        <div className="w-full rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] md:w-72 lg:w-96">
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            ช่องทางที่ทำงาน
          </h3>
          <DonutChart
            centerLabel="100%"
            centerSublabel="การเข้าถึง"
            segments={channelReach}
          />
        </div>
      </div>

      {/** AI insights */}
      {/* TODO: replace with real AI-generated insights once backend/AI integration exists */}
      <div className="border-seadark-hover bg-sealight mt-6 rounded-[10px] border p-6">
        <h3 className="font-thai text-amalfidark text-2xl font-bold">
          น้องดี AI สรุปให้
        </h3>
        <p className="font-thai mt-1 text-base text-black">
          3 ข้อสำคัญที่คุณควรรู้จากรายงานนี้
        </p>
        <div className="mt-4 flex flex-col flex-wrap gap-4 sm:flex-row">
          {aiInsights.map((insight, i) => (
            <div
              key={insight}
              className="border-seadark-hover flex min-w-40 flex-1 gap-2 rounded-xl border bg-white p-3 sm:min-w-55"
            >
              <span className="bg-sealight-active text-amalfidark flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {i + 1}
              </span>
              <p className="font-thai text-base text-black">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/** Bottom row: top campaigns + audience segments */}
      <div className="mt-6 flex flex-col gap-5 md:flex-row">
        <div className="flex-1 rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row items-center justify-between">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              แคมเปญที่ทำงานดีที่สุด
            </h3>
            <Link
              to="/campaign"
              className="font-thai text-seadark-hover hover:text-seadarker flex items-center gap-1 text-base font-semibold"
            >
              ดูทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {/* TODO: compute real top-campaigns ranking from live performance data */}
          <div className="overflow-x-auto">
            <div className="mt-4 flex min-w-100 flex-row justify-between px-2 text-base font-bold text-black">
              <span className="font-thai text-base">แคมเปญ</span>
              <div className="flex flex-row gap-10">
                <span className="font-thai w-20 text-right">การเข้าถึง</span>
                <span className="font-thai w-14 text-right">ออเดอร์</span>
                <span className="font-thai w-12 text-right">ROI</span>
              </div>
            </div>
            <div className="mt-2 flex min-w-100 flex-col gap-3">
              {topCampaigns.map((c) => (
                <div
                  key={c.rank}
                  className="border-seadark-hover flex flex-row items-center justify-between rounded-xl border px-3 py-3"
                >
                  <div className="flex flex-row items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold ${c.badgeClass}`}
                    >
                      {c.rank}
                    </span>
                    <p className="font-thai text-base text-black">{c.name}</p>
                  </div>
                  <div className="flex flex-row gap-10 text-base text-black">
                    <span className="w-16 text-right">
                      {c.reach.toLocaleString()}
                    </span>
                    <span className="w-14 text-right">
                      {c.orders.toLocaleString()}
                    </span>
                    <span className="w-12 text-right font-semibold text-[#519b5c]">
                      {c.roi}x
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TODO: replace with a real customer-segment breakdown chart computed from audience data */}
        <div className="w-full rounded-xl border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] md:w-80 lg:w-108">
          <h3 className="font-thai text-amalfidark text-2xl font-bold">
            กลุ่มลูกค้าที่กดดู
          </h3>
          <DonutChart
            centerLabel="100%"
            centerSublabel="กลุ่มอายุ"
            segments={audienceSegments}
          />
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default Overview
