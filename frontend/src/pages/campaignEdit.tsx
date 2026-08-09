import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  Plus,
  Target,
  Users,
  MousePointerClick,
  ShoppingCart,
  Shuffle,
  X,
} from 'lucide-react'
import { campaigns, platformBadgeStyles } from '@/data/campaigns'

const draftAgeRange = '22–38 ปี'
const forecast = {
  accuracy: 92,
  reach: [23520, 31987],
  clicks: [1223, 1855],
  orders: [159, 278],
}

function CampaignEdit() {
  const { campaignId } = useParams()
  const campaign = campaigns.find((c) => c.id === campaignId)

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

  return <CampaignEditView campaign={campaign} />
}

function CampaignEditView({
  campaign,
}: {
  campaign: (typeof campaigns)[number]
}) {
  const navigate = useNavigate()
  const creatives = campaign.creatives

  const [days, setDays] = useState(campaign.daysRemaining)
  const [perDay, setPerDay] = useState(campaign.dailyAvgSpend)
  const totalBudget = days * perDay

  const totalReach = campaign.channelReach.reduce((sum, c) => sum + c.reach, 0)

  const [interests, setInterests] = useState<string[]>([])
  const [newInterest, setNewInterest] = useState('')
  const [isAddingInterest, setIsAddingInterest] = useState(false)

  const removeInterest = (tag: string) =>
    setInterests((prev) => prev.filter((t) => t !== tag))

  const addInterest = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newInterest.trim()
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed])
    }
    setNewInterest('')
    setIsAddingInterest(false)
  }

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/campaign')}
          className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
        >
          <ChevronLeft className="text-amalfidark h-7 w-7" />
        </button>
        <h1 className="font-thai text-amalfidark text-4xl font-bold">
          แก้ไขแคมเปญ
        </h1>
      </div>

      <div className="mt-6 flex items-start gap-5">
        {/** Left column */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              ชื่อแคมเปญ & เป้าหมาย
            </h3>
            <p className="font-thai mt-1 text-lg text-black">
              แก้ไขชื่อและเป้าหมายของแคมเปญนี้ได้ตามต้องการ
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-citrus flex h-13 w-13 shrink-0 items-center justify-center rounded-lg">
                <Target className="h-7 w-7 text-black" />
              </div>
              <div className="font-thai">
                <p className="text-citrusdark-hover text-2xl font-semibold">
                  {campaign.title}
                </p>
                <p className="mt-1 text-lg text-[#8e98a8]">
                  เป้าหมาย:{' '}
                  <span className="font-bold text-black">{campaign.goal}</span>{' '}
                  · ระยะเวลา:{' '}
                  <span className="font-bold text-black">{days} วัน</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              กลุ่มเป้าหมาย & ขนาดตลาด
            </h3>
            <p className="font-thai mt-1 text-lg text-black">
              AI ประเมินจากข้อมูล Facebook + Google
            </p>
            <div className="font-thai mt-4">
              <p className="text-xl font-bold text-black">อายุ</p>
              <p className="mt-1 text-lg text-black">{draftAgeRange}</p>
            </div>
            <div className="font-thai mt-4">
              <p className="text-xl font-bold text-black">ความสนใจ</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {interests.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeInterest(tag)}
                    className="font-thai bg-sealight-active text-seadark-active flex items-center gap-1 rounded-lg px-3 py-1 text-lg transition-all hover:scale-105 hover:cursor-pointer"
                  >
                    {tag}
                    <X className="h-3 w-3" />
                  </button>
                ))}
                {isAddingInterest ? (
                  <form
                    onSubmit={addInterest}
                    className="flex items-center gap-1"
                  >
                    <input
                      autoFocus
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onBlur={() => setIsAddingInterest(false)}
                      placeholder="พิมพ์แล้วกด Enter"
                      className="font-thai w-32 rounded-lg border border-[#8E98A8] px-2 py-1 text-lg outline-none"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingInterest(true)}
                    className="font-thai flex items-center gap-1 rounded-lg border border-dashed border-[#8E98A8] px-3 py-1 text-lg text-[#8e98a8]"
                  >
                    <Plus className="h-3 w-3" />
                    เพิ่ม
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              แบ่งงบให้แต่ละช่องทาง
            </h3>
            <p className="font-thai mt-1 text-lg text-black">
              AI วิเคราะห์ว่าช่องทางไหนคุ้มที่สุดในกลุ่มเป้าหมายของคุณ
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {campaign.channelReach.map((channel) => {
                const badge = platformBadgeStyles[channel.platform]
                const pct = totalReach > 0 ? channel.reach / totalReach : 0
                const spend = Math.round(totalBudget * pct)
                return (
                  <div
                    key={channel.platform}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={`font-thai flex items-center gap-1 rounded-lg px-3 py-1 text-lg font-semibold ${badge.bg} ${badge.textColor}`}
                    >
                      <img src={badge.icon} alt="" className="h-4 w-4" />
                      {badge.label}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-[rgba(142,152,168,0.3)]">
                      <div
                        className="bg-seaactive h-2 rounded-full"
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                    <span className="text-base font-semibold text-black">
                      ฿{spend.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              ครีเอทีฟที่ AI สร้าง
            </h3>
            <p className="font-thai mt-1 text-lg text-black">
              กด &apos;แก้ไข&apos; เพื่อแก้คำ หรือกด ✨ บนการ์ดเพื่อสุ่มใบใหม่
            </p>
            <div className="mt-4 flex gap-4">
              {creatives.map((creative) => (
                <div
                  key={creative.rank}
                  className="min-w-0 flex-1 overflow-hidden rounded-xl border border-[#8E98A8]"
                >
                  <img
                    src={creative.image}
                    alt={creative.caption}
                    className="h-37 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-thai text-lg text-black">
                      {creative.caption}
                    </p>
                    <button
                      type="button"
                      className="font-thai text-seadark hover:text-seadark-active mt-2 flex items-center gap-1 text-lg hover:scale-105 hover:cursor-pointer"
                    >
                      <Shuffle className="h-3 w-3" />
                      สุ่มใหม่
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/** Right column */}
        <div className="flex w-97 shrink-0 flex-col gap-5">
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              งบประมาณ
            </h3>

            <div className="font-thai mt-4">
              <p className="text-xl font-bold text-black">ระยะเวลา</p>
              <div className="bg-sealight-active mt-1 flex items-center justify-between rounded-2xl px-4 py-2">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={days}
                  onChange={(e) =>
                    setDays(
                      Math.min(90, Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                  className="w-16 bg-transparent text-xl font-semibold text-black outline-none"
                />
                <span className="text-xl font-semibold text-black">วัน</span>
              </div>
            </div>

            <div className="font-thai mt-4">
              <div className="flex items-center justify-between text-xl font-bold text-black">
                <span>ต่อวัน</span>
                <span>฿{perDay.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={perDay}
                onChange={(e) => setPerDay(Number(e.target.value))}
                className="accent-citrushover mt-2 w-full"
              />
              <div className="font-thai mt-1 flex justify-between text-base text-black">
                <span>฿100</span>
                <span>฿2,000 / วัน</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#8E98A8] pt-3">
              <p className="font-thai text-lg font-bold text-black">
                งบทั้งหมด
              </p>
              <p className="text-citrusdark text-2xl font-bold">
                ฿{totalBudget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <h3 className="font-thai text-amalfidark text-2xl font-bold">
                คาดการณ์
              </h3>
              <span className="font-thai text-lg text-black">
                ความแม่นยำ {forecast.accuracy}%
              </span>
            </div>
            <div className="font-thai mt-4 flex flex-col gap-3 text-lg text-black">
              <div className="flex items-center gap-2">
                <Users className="text-amalfidark h-6 w-6 shrink-0" />
                <div>
                  <p className="font-bold">เข้าถึง</p>
                  <p>
                    {forecast.reach[0].toLocaleString()} –{' '}
                    {forecast.reach[1].toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MousePointerClick className="text-amalfidark h-6 w-6 shrink-0" />
                <div>
                  <p className="font-bold">คลิก</p>
                  <p>
                    {forecast.clicks[0].toLocaleString()} –{' '}
                    {forecast.clicks[1].toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-amalfidark h-6 w-6 shrink-0" />
                <div>
                  <p className="font-bold">ออเดอร์</p>
                  <p>
                    {forecast.orders[0].toLocaleString()} –{' '}
                    {forecast.orders[1].toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/campaign/${campaign.id}/report`)}
            className="bg-citrus hover:bg-citrushover font-thai text-amalfidark flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-2xl font-bold shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all hover:scale-105 hover:cursor-pointer"
          >
            บันทึกการแก้ไข
          </button>
          <button
            type="button"
            onClick={() => navigate(`/campaign/${campaign.id}/report`)}
            className="font-thai bg-sealight-hover border-seadark text-seadark hover:bg-sealight-active hover:text-seadark-active w-full rounded-xl border-[1.5px] py-3 text-lg font-semibold hover:scale-105 hover:cursor-pointer"
          >
            ยกเลิกการแก้ไข
          </button>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CampaignEdit
