import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
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
import sparklebold from '@/assets/sparklebold.svg'
import facebook from '@/assets/facebook.svg'
import StepIndicator from '@/components/stepIndicator'
import { campaigns } from '@/data/campaigns'

const draftBrief =
  'ใช้โอกาสฝนตกพรุ่งนี้ ทำแคมเปญเครื่องดื่มร้อน + ของหวานในย่านสีลม งบ 300 บาท/วัน'
const draftCampaignName = 'ดีลฝนพรำ ลาเต้+ครัวซองต์ ลด 25%'
const draftGoal = 'เพิ่มยอดขายช่วงบ่ายฝนตก'
const draftAgeRange = '22–38 ปี'
const forecast = {
  accuracy: 92,
  reach: [23520, 31987],
  clicks: [1223, 1855],
  orders: [159, 278],
}

function CampaignReview() {
  const navigate = useNavigate()
  const draftCampaign = campaigns.find((c) => c.id === 'rain-promo-2026')
  const creatives = draftCampaign?.creatives ?? []

  const [days, setDays] = useState(14)
  const [perDay, setPerDay] = useState(350)
  const totalBudget = days * perDay

  const [interests, setInterests] = useState([
    'ของหวาน',
    'Work From Cafe',
    'คาเฟ่ฮอปปิ้ง',
  ])
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
    <div className="min-h-full min-w-full p-10">
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
          ตรวจสอบและเปิดตัวแคมเปญ
        </h1>
      </div>

      <div className="mt-6">
        <StepIndicator currentStep={3} />
      </div>

      <div className="mt-6 flex items-start gap-5">
        {/** Left column */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-xl font-bold">
              บรีฟของคุณ
            </h3>
            <p className="font-thai mt-2 text-base text-black">{draftBrief}</p>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-xl font-bold">
              ชื่อแคมเปญ & เป้าหมาย
            </h3>
            <p className="font-thai mt-1 text-xs text-black">
              AI ตั้งชื่อจากบรีฟ — คลิก &apos;แก้ไข&apos; เพื่อเขียนเอง หรือ
              &apos;สร้างใหม่&apos; ให้ AI เสนอชื่ออื่น
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-citrus flex h-13 w-13 shrink-0 items-center justify-center rounded-lg">
                <Target className="h-7 w-7 text-black" />
              </div>
              <div className="font-thai">
                <p className="text-citrusdark-hover text-xl font-semibold">
                  {draftCampaignName}
                </p>
                <p className="mt-1 text-xs text-[#8e98a8]">
                  เป้าหมาย:{' '}
                  <span className="font-bold text-black">{draftGoal}</span> ·
                  ระยะเวลา:{' '}
                  <span className="font-bold text-black">{days} วัน</span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-xl font-bold">
              กลุ่มเป้าหมาย & ขนาดตลาด
            </h3>
            <p className="font-thai mt-1 text-xs text-black">
              AI ประเมินจากข้อมูล Facebook + Google
            </p>
            <div className="font-thai mt-4">
              <p className="text-lg font-bold text-black">อายุ</p>
              <p className="mt-1 text-sm text-black">{draftAgeRange}</p>
            </div>
            <div className="font-thai mt-4">
              <p className="text-lg font-bold text-black">ความสนใจ</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {interests.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeInterest(tag)}
                    className="font-thai bg-sealight-active text-seadark-active flex items-center gap-1 rounded-lg px-3 py-1 text-xs"
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
                      className="font-thai w-32 rounded-lg border border-[#8E98A8] px-2 py-1 text-xs outline-none"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingInterest(true)}
                    className="font-thai flex items-center gap-1 rounded-lg border border-dashed border-[#8E98A8] px-3 py-1 text-xs text-[#8e98a8]"
                  >
                    <Plus className="h-3 w-3" />
                    เพิ่ม
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-xl font-bold">
              แบ่งงบให้แต่ละช่องทาง
            </h3>
            <p className="font-thai mt-1 text-xs text-black">
              AI วิเคราะห์ว่าช่องทางไหนคุ้มที่สุดในกลุ่มเป้าหมายของคุณ
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-thai flex items-center gap-1 rounded-lg bg-[#72adff] px-3 py-1 text-sm font-bold text-white">
                <img src={facebook} alt="" className="h-4 w-4" />
                Facebook
              </span>
              <div className="h-2 flex-1 rounded-full bg-[rgba(142,152,168,0.3)]">
                <div
                  className="h-2 rounded-full bg-seaactive"
                  style={{ width: '70%' }}
                />
              </div>
              <span className="text-sm font-semibold text-black">฿3,430</span>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-xl font-bold">
              ครีเอทีฟที่ AI สร้าง
            </h3>
            <p className="font-thai mt-1 text-xs text-black">
              3 ตัวอย่างพร้อมแคปชั่น — กด &apos;แก้ไข&apos; เพื่อแก้คำ หรือกด ✨
              บนการ์ดเพื่อสุ่มใบใหม่
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
                    <p className="font-thai text-xs text-black">
                      {creative.caption}
                    </p>
                    <button
                      type="button"
                      className="font-thai text-seadark mt-2 flex items-center gap-1 text-xs"
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
            <h3 className="font-thai text-amalfidark text-xl font-bold">
              งบประมาณ
            </h3>

            <div className="font-thai mt-4">
              <p className="text-sm font-bold text-black">ระยะเวลา</p>
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
                  className="w-16 bg-transparent text-lg font-semibold text-black outline-none"
                />
                <span className="text-sm font-semibold text-black">วัน</span>
              </div>
            </div>

            <div className="font-thai mt-4">
              <div className="flex items-center justify-between text-sm font-bold text-black">
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
              <div className="font-thai mt-1 flex justify-between text-xs text-black">
                <span>฿100</span>
                <span>฿2,000 / วัน</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#8E98A8] pt-3">
              <p className="font-thai text-base font-bold text-black">
                งบทั้งหมด
              </p>
              <p className="text-citrusdark text-2xl font-bold">
                ฿{totalBudget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center justify-between">
              <h3 className="font-thai text-amalfidark text-xl font-bold">
                คาดการณ์
              </h3>
              <span className="font-thai text-xs text-black">
                ความแม่นยำ {forecast.accuracy}%
              </span>
            </div>
            <div className="font-thai mt-4 flex flex-col gap-3 text-sm text-black">
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
            onClick={() => navigate('/campaign/rain-promo-2026/report')}
            className="bg-citrus hover:bg-citrushover font-thai text-amalfidark flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
          >
            <img src={sparklebold} alt="" className="h-6 w-6" />
            เปิดตัวแคมเปญเลย
          </button>
          <button
            type="button"
            className="font-thai bg-sealight-hover border-seadark text-seadark w-full rounded-xl border-[1.5px] py-3 text-base"
          >
            บันทึกเป็นฉบับร่าง
          </button>
          <button
            type="button"
            onClick={() => navigate('/campaign/new')}
            className="font-thai w-full py-2 text-center text-sm text-[#8e98a8] underline"
          >
            เริ่มใหม่ด้วยบรีฟอื่น
          </button>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CampaignReview
