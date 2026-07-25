import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Users,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  Pause,
  Play,
  Plus,
} from 'lucide-react'
import cash from '@/assets/cash.svg'
import { campaigns } from '@/data/campaigns'
import type { Creative } from '@/data/campaigns'

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
    <div className="w-64 rounded-[12px] border border-[#8E98A8] bg-white p-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-thai text-amalfi text-lg font-bold">{label}</h3>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-citrusdark text-3xl font-bold">{value}</p>
        {trend && (
          <span className="flex items-center gap-1 text-sm font-medium text-[#519b5c]">
            <TrendingUp className="h-4 w-4" />
            {trend}
          </span>
        )}
      </div>
      <p className="font-thai mt-2 text-sm font-semibold text-black">
        {caption}
      </p>
    </div>
  )
}

function CreativeCard({ creative }: { creative: Creative }) {
  return (
    <div className="w-57 overflow-hidden rounded-[12px] border border-[#8E98A8]">
      <div className="relative">
        <img
          src={creative.image}
          alt={creative.caption}
          className="h-37 w-full object-cover"
        />
        <span
          className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold"
          style={{
            color: creative.badgeBorderColor,
            border: `1px solid ${creative.badgeBorderColor}`,
          }}
        >
          #{creative.rank}
        </span>
      </div>
      <div className="p-3">
        <p className="font-thai text-xs text-black">{creative.caption}</p>
        <div className="mt-2 flex gap-4">
          <div>
            <p className="font-thai text-seadark text-[10px]">การแสดงผล</p>
            <p className="text-[10px] font-semibold text-black">
              {creative.impressions.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="font-thai text-seadark text-[10px]">CTR</p>
            <p className="text-[10px] font-semibold text-black">
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
  const campaign = campaigns.find((c) => c.id === campaignId)

  if (!campaign) {
    return (
      <div className="flex min-h-full min-w-full flex-col items-center justify-center gap-4 p-10">
        <p className="font-thai text-xl text-black">ไม่พบแคมเปญนี้</p>
        <Link to="/campaign" className="font-thai text-amalfi underline">
          กลับไปหน้าแคมเปญ
        </Link>
      </div>
    )
  }

  const budgetPct = Math.round(
    (campaign.budgetSpent / campaign.budgetTotal) * 100,
  )

  return (
    <div className="min-h-full min-w-full p-10">
      {/** Header */}
      <div className="flex flex-row items-center justify-between">
        <div className="font-thai flex flex-col gap-2 font-semibold">
          <h1 className="text-amalfidark text-4xl font-bold">
            {campaign.title}
          </h1>
          <p className="text-base font-semibold text-black">
            {campaign.goal} · ระยะเวลา: เหลืออีก {campaign.daysRemaining} วัน
          </p>
        </div>
        <span className="font-thai flex items-center gap-2 text-xl text-[#8E98A8]">
          {campaign.status === 'active' ? (
            <>
              <Play className="h-6 w-6" />
              กำลังทำงาน
            </>
          ) : (
            <>
              <Pause className="h-6 w-6" />
              หยุดชั่วคราว
            </>
          )}
        </span>
      </div>

      {/** Metric cards */}
      <div className="mt-6 flex flex-row gap-5">
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
      <div className="mt-6 flex flex-row gap-5">
        <div className="flex-1 rounded-[12px] border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row items-center justify-between">
            <h3 className="font-thai text-amalfidark text-lg font-bold">
              การใช้งบประมาณ
            </h3>
            <p className="font-thai text-sm text-black">
              <span className="font-bold">
                ฿{campaign.budgetSpent.toLocaleString()}
              </span>{' '}
              / ฿{campaign.budgetTotal.toLocaleString()} · ใช้ไปแล้ว {budgetPct}
              %
            </p>
          </div>
          <div className="mt-3 h-[22px] w-full rounded-[12px] bg-[rgba(142,152,168,0.5)] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]">
            <div
              className="bg-citrus h-[22px] rounded-[12px] shadow-[0px_1px_4px_0px_rgba(0,0,0,0.25)]"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="font-thai mt-2 flex flex-row justify-between text-xs text-[#a6a6a6]">
            <span>วันละ ฿{campaign.dailyAvgSpend} เฉลี่ย</span>
            <span>เหลือเวลาอีก {campaign.daysRemaining} วัน</span>
          </div>
        </div>
        <div className="bg-amalfihover w-96 rounded-[12px] p-5 text-white">
          <p className="font-thai text-sm">Return on Investment</p>
          <p className="text-2xl font-bold">{campaign.roi}x</p>
          <p className="font-thai mt-8 text-[10px]">
            เทียบกับมาตรฐาน {campaign.roiBenchmark}x ในกลุ่มเดียวกัน
          </p>
        </div>
      </div>

      {/** AI insights */}
      <div className="border-seadark bg-sealight mt-6 rounded-[10px] border p-6">
        <h3 className="font-thai text-amalfidark mb-4 text-lg font-bold">
          น้องดี AI สรุปแคมเปญนี้ให้
        </h3>
        <div className="flex flex-row gap-4">
          {campaign.insights.map((insight, i) => (
            <div
              key={i}
              className="border-seadark flex flex-1 gap-2 rounded-[12px] border bg-white p-3"
            >
              <span className="bg-sealight-active text-amalfidark flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {i + 1}
              </span>
              <p className="font-thai text-xs text-black">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/** Charts */}
      <div className="mt-6 flex flex-row gap-5">
        <div className="flex-1 rounded-[12px] border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <div className="flex flex-row items-center justify-between">
            <div>
              <h3 className="font-thai text-amalfidark text-lg font-bold">
                แนวโน้มรายวัน
              </h3>
              <p className="font-thai text-sm text-black">
                การเข้าถึง vs. งบที่ใช้
              </p>
            </div>
            <img src={campaign.lineChartLegendImage} alt="" className="h-9" />
          </div>
          <img
            src={campaign.lineChartImage}
            alt="แนวโน้มรายวัน"
            className="mt-4 w-full"
          />
        </div>
        <div className="w-96 rounded-[12px] border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <h3 className="font-thai text-amalfidark text-lg font-bold">
            ช่องทางที่ทำงาน
          </h3>
          <img
            src={campaign.donutChartImage}
            alt="สัดส่วนช่องทาง"
            className="mt-4 w-full"
          />
        </div>
      </div>

      {/** Creatives */}
      <div className="mt-6 rounded-[12px] border border-[#8E98A8] bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex flex-row items-center justify-between">
          <div>
            <h3 className="font-thai text-amalfidark text-lg font-bold">
              ครีเอทีฟที่กำลังทำงาน
            </h3>
            <p className="font-thai text-sm text-black">
              AI ทดสอบ A/B/C อัตโนมัติ เพื่อหาว่าใบไหนได้ผลที่สุด
            </p>
          </div>
          {/* TODO: implement real creative creation flow */}
          <button className="bg-seaactive font-thai flex items-center gap-1 rounded-[15px] px-4 py-2 text-sm text-white">
            <Plus className="h-5 w-5" />
            สร้างครีเอทีฟใหม่
          </button>
        </div>
        <div className="mt-5 flex flex-row gap-5">
          {campaign.creatives.map((creative) => (
            <CreativeCard key={creative.rank} creative={creative} />
          ))}
          <div className="h-58 w-57 rounded-[12px] border-2 border-dashed border-[#8E98A8] bg-[rgba(142,152,168,0.1)]" />
        </div>
      </div>
    </div>
  )
}

export default CampaignReport
