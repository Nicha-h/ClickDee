import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { campaigns, platformBadgeStyles } from '@/data/campaigns'
import type { CampaignItem } from '@/data/campaigns'
import { useSimulatedLoading } from '@/components/useSimulatedLoading'
import CampaignSkeleton from '@/components/campaignSkeleton'

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

type FilterTab = { key: string; label: string; count: number }

{
  /** Filter tabs PLACEHOLDER fix this to reflect actual filter logic */
}
const filterTabs: FilterTab[] = [
  { key: 'all', label: 'ทั้งหมด', count: 12 },
  { key: 'active', label: 'กำลังทำงาน', count: 8 },
  { key: 'paused', label: 'หยุดชั่วคราว', count: 4 },
  { key: 'draft', label: 'ฉบับร่าง', count: 1 },
  { key: 'ended', label: 'สิ้นสุดแล้ว', count: 1 },
]

function CampaignCard({ campaign }: { campaign: CampaignItem }) {
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
            <span className="font-thai flex items-center gap-1 rounded-full bg-[#caf3d0] px-3 py-1 text-base font-medium text-[#519b5c]">
              {/** Status badge FLAGGED wrong status. Add a campaign that has a different status later*/}
              <span className="h-2 w-2 rounded-full bg-[#519b5c]" />
              กำลังทำงาน
            </span>
            <span className="font-thai text-citrusdark flex items-center gap-1 text-lg font-medium">
              <Clock className="h-4 w-4" />
              เหลือ {campaign.daysRemaining} วัน
            </span>
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
          <img
            src={campaign.trendImage}
            alt=""
            className="hidden h-26.5 w-51 shrink-0 object-contain sm:block"
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
          {campaign.status === 'active' ? (
            <button className="font-thai text-amalfi hover:text-amalfidark flex items-center gap-2 text-base hover:cursor-pointer hover:font-semibold">
              <Pause className="h-5 w-5" />
              หยุดชั่วคราว
            </button>
          ) : (
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
        </div>
      </div>
    </div>
  )
}

function Campaign() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')
  const isLoading = useSimulatedLoading()

  if (isLoading) return <CampaignSkeleton />

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
      {/* TODO: wire up real filtering by campaign status once API is available */}
      <div className="mt-8 flex flex-row items-center gap-3 overflow-x-auto">
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
      {/* TODO: implement real search against campaign list */}
      <div className="border-seadark mt-4 flex w-full flex-row items-center justify-around gap-2 rounded-[19px] border-2 px-4 py-2">
        <Search className="text-seadark h-5 w-5" />
        <input
          type="text"
          placeholder="ค้นหาแคมเปญ..."
          className="font-thai flex-1 text-lg outline-none"
        />
      </div>

      {/** Campaign list */}
      <div className="mt-8 flex flex-col gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
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

        <button className="bg-amalfihover font-thai hover:bg-amalfiactive flex shrink-0 items-center gap-1 rounded-[19px] px-6 py-2 text-lg font-semibold text-white transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg">
          สร้างเลย
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default Campaign
