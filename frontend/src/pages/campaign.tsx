import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Search,
  Clock,
  ChevronRight,
  Pause,
  Play,
  Pencil,
} from 'lucide-react'
import rocket from '@/assets/rocket.svg'
import cash from '@/assets/cash.svg'
import starcircle from '@/assets/starcircle.svg'
import sparklebold from '@/assets/sparklebold.svg'
import { campaigns, platformBadgeStyles } from '@/data/campaigns'
import type { CampaignItem } from '@/data/campaigns'

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

const filterTabs: FilterTab[] = [
  { key: 'all', label: 'ทั้งหมด', count: 12 },
  { key: 'active', label: 'กำลังทำงาน', count: 8 },
  { key: 'paused', label: 'หยุดชั่วคราว', count: 4 },
  { key: 'draft', label: 'ฉบับร่าง', count: 1 },
  { key: 'ended', label: 'สิ้นสุดแล้ว', count: 1 },
]

function CampaignCard({ campaign }: { campaign: CampaignItem }) {
  return (
    <div className="flex flex-row overflow-hidden rounded-xl border border-[#8E98A8] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <img
        src={campaign.thumbnail}
        alt={campaign.title}
        className="h-62 w-40 shrink-0 rounded-tl-xl rounded-bl-xl object-cover"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-row items-start justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              {campaign.title}
            </h3>
            <p className="font-thai text-base font-bold text-black">
              {campaign.goal}
            </p>
          </div>
          <div className="flex flex-row items-center gap-2">
            <span className="font-thai flex items-center gap-1 rounded-full bg-[#caf3d0] px-3 py-1 text-xs font-medium text-[#519b5c]">
              <span className="h-2 w-2 rounded-full bg-[#519b5c]" />
              กำลังทำงาน
            </span>
            <span className="font-thai text-citrusdark flex items-center gap-1 text-sm font-medium">
              <Clock className="h-4 w-4" />
              เหลือ {campaign.daysRemaining} วัน
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-2">
          {campaign.platforms.map((platform) => {
            const badge = platformBadgeStyles[platform]
            return (
              <span
                key={platform}
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-white ${badge.bg}`}
              >
                <img src={badge.icon} alt="" className="h-3 w-3" />
                {badge.label}
              </span>
            )
          })}
        </div>
        <div className="grid grid-cols-5 gap-2">
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
            <p className="font-thai text-amalfidark text-base font-bold">CPA</p>
            <p className="text-2xl font-bold text-black">฿{campaign.cpa}</p>
          </div>
          <div>
            <p className="font-thai text-amalfidark text-base font-bold">ROI</p>
            <p className="text-2xl font-bold text-[#519b5c]">{campaign.roi}x</p>
          </div>
        </div>
        <img
          src={campaign.trendImage}
          alt=""
          className="h-20 w-40 self-end object-contain"
        />
      </div>
      <div className="flex w-36 shrink-0 flex-col items-end justify-start gap-4 p-5">
        <Link
          to={`/campaign/${campaign.id}/report`}
          className="border-seadark bg-sealight-hover font-thai text-seadark-hover hover:bg-sealight-active flex items-center gap-1 rounded-[19px] border px-4 py-2 text-sm"
        >
          ดูรายงาน
          <ChevronRight className="h-4 w-4" />
        </Link>
        {campaign.status === 'active' ? (
          <button className="font-thai text-amalfidark hover:text-amalfi flex items-center gap-2 text-sm">
            <Pause className="h-5 w-5" />
            หยุดชั่วคราว
          </button>
        ) : (
          <button className="font-thai text-amalfidark hover:text-amalfi flex items-center gap-2 text-sm">
            <Play className="h-5 w-5" />
            เริ่มแคมเปญ
          </button>
        )}
        <button className="font-thai text-amalfidark hover:text-amalfi flex items-center gap-2 text-sm">
          <Pencil className="h-5 w-5" />
          แก้ไข
        </button>
      </div>
    </div>
  )
}

function Campaign() {
  const [activeFilter, setActiveFilter] = useState('all')

  return (
    <div className="min-h-full min-w-full p-10">
      {/** Header */}
      <div className="font-thai flex flex-col gap-2 font-semibold">
        <h1 className="text-amalfidark text-4xl font-semibold">แคมเปญของฉัน</h1>
        <p className="text-lg font-semibold text-black">
          จัดการโฆษณาทั้งหมดของคุณ — AI ดูแลการเสนอราคา จัดสรรงบ
          และเพิ่มประสิทธิภาพให้อัตโนมัติ
        </p>
      </div>

      {/** Create campaign button */}
      <div className="mt-6">
        <button className="bg-citrus font-thai hover:bg-citrushover rounded-[19px] px-8 py-4 text-xl font-bold text-black shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg">
          <img
            src={rocket}
            alt="Rocket"
            className="mr-3 -ml-2 inline-block h-8 w-8 brightness-0"
          />
          สร้างโฆษณาใหม่
        </button>
      </div>

      {/** Stat cards */}
      <div className="mt-8 flex flex-row items-stretch gap-5">
        <div className="h-32 w-85 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <img
              src={rocket}
              alt="Campaigns"
              className="mr-2 inline-block h-9 w-9 brightness-0"
            />
            <h2 className="font-thai text-amalfi text-xl font-semibold">
              แคมเปญที่กำลังทำงาน
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-3xl font-bold">
            {activeCampaigns}
          </p>
          <p className="font-thai mt-2 px-4 text-sm font-semibold text-black">
            จาก {totalCampaigns} แคมเปญทั้งหมด
          </p>
        </div>
        <div className="w-72 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <img src={cash} alt="Spend" className="mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi text-xl font-semibold">
              ใช้จ่ายรวมเดือนนี้
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-3xl font-bold">
            ฿{totalSpend.toLocaleString()}
          </p>
          <p className="font-thai mt-2 px-4 text-sm font-semibold text-black">
            งบ ฿{totalBudget.toLocaleString()} · เหลือ ฿
            {remainingBudget.toLocaleString()}
          </p>
        </div>
        <div className="w-72 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row items-center p-4">
            <ShoppingCart className="text-amalfi mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi text-xl font-semibold">
              ออเดอร์รวม
            </h2>
          </div>
          <p className="text-citrusdark px-4 text-3xl font-bold">
            {totalOrders.toLocaleString()}
          </p>
          <p className="font-thai mt-2 px-4 text-sm font-semibold text-black">
            +{ordersDelta} จากเมื่อวาน
          </p>
        </div>
        <div className="bg-amalfi w-72 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="flex flex-row justify-between p-4">
            <h2 className="font-thai text-xl font-semibold text-white">ROI</h2>
            <img src={starcircle} alt="ROI" className="inline-block h-9 w-9" />
          </div>
          <p className="px-4 text-3xl font-bold text-white">
            {roi.toFixed(1)}x
          </p>
          <p className="font-thai mt-2 px-4 text-sm font-semibold text-white">
            ผลตอบแทนดีเยี่ยม
          </p>
        </div>
      </div>

      {/** Filter tabs + search */}
      {/* TODO: wire up real filtering by campaign status once API is available */}
      <div className="mt-8 flex flex-row items-center gap-3">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`font-thai rounded-[19px] px-5 py-2 text-sm font-semibold transition-colors ${
              activeFilter === tab.key
                ? 'bg-seaactive text-white'
                : 'bg-sealight-active text-seadark-hover hover:bg-sealight-hover'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
      {/* TODO: implement real search against campaign list */}
      <div className="border-seadark mt-4 flex w-72 flex-row items-center gap-2 rounded-[19px] border-2 px-4 py-2">
        <Search className="text-seadark h-5 w-5" />
        <input
          type="text"
          placeholder="ค้นหาแคมเปญ..."
          className="font-thai flex-1 text-sm outline-none"
        />
      </div>

      {/** Campaign list */}
      <div className="mt-8 flex max-h-[600px] flex-col gap-6 overflow-y-auto pr-2">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      {/** AI suggestion banner */}
      <div className="border-seadark bg-sealight mt-8 flex flex-row items-start gap-4 rounded-[10px] border p-6">
        <div className="bg-citrus rounded-xl p-4 shadow-md">
          <img src={sparklebold} alt="Sparkle" className="h-8 w-8" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <p className="font-thai text-amalfidark text-sm font-semibold">
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
        <button className="bg-amalfihover font-thai hover:bg-amalfiactive flex shrink-0 items-center gap-1 rounded-[19px] px-5 py-2 text-sm font-semibold text-white">
          สร้างเลย
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Campaign
