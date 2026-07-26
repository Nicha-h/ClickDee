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
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              บรีฟของคุณ
            </h3>
            <p className="font-thai mt-2 text-lg text-black">{draftBrief}</p>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              ชื่อแคมเปญ & เป้าหมาย
            </h3>
            <p className="font-thai mt-1 text-lg text-black">
              AI ตั้งชื่อจากบรีฟ — คลิก &apos;แก้ไข&apos; เพื่อเขียนเอง หรือ
              &apos;สร้างใหม่&apos; ให้ AI เสนอชื่ออื่น
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-citrus flex h-13 w-13 shrink-0 items-center justify-center rounded-lg">
                <Target className="h-7 w-7 text-black" />
              </div>
              <div className="font-thai">
                <p className="text-citrusdark-hover text-2xl font-semibold">
                  {draftCampaignName}
                </p>
                <p className="mt-1 text-lg text-[#8e98a8]">
                  เป้าหมาย:{' '}
                  <span className="font-bold text-black">{draftGoal}</span> ·
                  ระยะเวลา:{' '}
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
                    className="font-thai bg-sealight-active text-seadark-active 
                    flex items-center gap-1 rounded-lg px-3 py-1 text-lg hover:scale-105 transition-all hover:cursor-pointer"
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
            <div className="mt-4 flex items-center gap-3">
              <span className="font-thai flex items-center gap-1 rounded-lg bg-[#72adff] px-3 py-1 text-lg font-semibold text-white">
                <img src={facebook} alt="" className="h-4 w-4" />
                Facebook
              </span>
              <div className="h-2 flex-1 rounded-full bg-[rgba(142,152,168,0.3)]">
                <div
                  className="bg-seaactive h-2 rounded-full"
                  style={{ width: '70%' }}
                />
              </div>
              <span className="text-base font-semibold text-black">฿3,430</span>
            </div>
          </div>

          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              ครีเอทีฟที่ AI สร้าง
            </h3>
            <p className="font-thai mt-1 text-lg text-black">
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
                    <p className="font-thai text-lg text-black">
                      {creative.caption}
                    </p>
                    <button
                      type="button"
                      className="font-thai text-seadark mt-2 flex items-center gap-1 text-lg hover:text-seadark-active hover:cursor-pointer hover:scale-105"
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
            onClick={() => navigate('/campaign/rain-promo-2026/report')}
            className="bg-citrus hover:bg-citrushover hover:cursor-pointer font-thai text-amalfidark flex w-full items-center justify-center gap-2 
            rounded-xl px-6 py-4 text-2xl font-bold shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-all hover:scale-105"
          >
            <svg
              width="23"
              height="22"
              viewBox="0 0 23 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-amalfi h-6 w-6"
            >
              <path
                d="M7.28391 15.7136C7.48508 15.8471 7.71342 15.9342 7.9524 15.9685C8.19138 16.0029 8.435 15.9837 8.66564 15.9122C8.89627 15.8408 9.10813 15.719 9.28587 15.5556C9.46362 15.3922 9.6028 15.1913 9.69332 14.9675L10.3953 12.6062C10.5662 12.0381 10.8671 11.5175 11.2741 11.0858C11.6811 10.6542 12.1831 10.3232 12.7403 10.1193L14.9563 9.32782C15.271 9.208 15.54 8.9919 15.7247 8.71032C15.8675 8.49676 15.9575 8.25231 15.9872 7.99714C16.0168 7.74197 15.9854 7.48339 15.8955 7.24276C15.8055 7.00212 15.6597 6.78633 15.4699 6.61318C15.2801 6.44003 15.0519 6.3145 14.804 6.24694L12.5691 5.59136C12.0008 5.42093 11.48 5.12047 11.048 4.71379C10.616 4.30712 10.2847 3.8054 10.0803 3.24841L9.28883 1.03339C9.16792 0.719816 8.95248 0.451603 8.67236 0.265916C8.39069 0.0834924 8.06022 -0.00899605 7.72478 0.000717342C7.38934 0.0104307 7.06478 0.121887 6.79414 0.320304C6.52109 0.525508 6.3194 0.811306 6.21755 1.13734L5.54742 3.42269C5.37561 3.97595 5.08021 4.48289 4.68357 4.90515C4.28693 5.32741 3.79945 5.65392 3.25801 5.85998L1.03996 6.65051C0.724614 6.77236 0.455089 6.98948 0.268885 7.27164C0.0826813 7.55381 -0.0109413 7.88701 0.00104328 8.22486C0.0130278 8.56272 0.130023 8.88844 0.335752 9.15671C0.541482 9.42497 0.825713 9.62244 1.1489 9.72165L3.38481 10.3772C4.10994 10.5974 4.7542 11.0262 5.23728 11.6101C5.51309 11.9453 5.72915 12.3242 5.87602 12.7321L6.66838 14.9441C6.78953 15.2587 7.00541 15.5276 7.28591 15.7135M17.2018 21.5089C17.4094 21.6468 17.6548 21.7166 17.9039 21.7087C18.1513 21.7023 18.3907 21.6195 18.5893 21.4718C18.7937 21.3184 18.9438 21.1037 19.0178 20.8591L19.3565 19.7058C19.4283 19.4663 19.5549 19.2468 19.7262 19.0648C19.8975 18.8827 20.1089 18.743 20.3436 18.6568L21.4981 18.2452C21.7308 18.1549 21.9298 17.9949 22.068 17.7871C22.2061 17.5793 22.2766 17.3338 22.2699 17.0844C22.2625 16.8284 22.1734 16.5815 22.0156 16.3798C21.8578 16.1781 21.6397 16.0322 21.393 15.9633L20.2388 15.6266C19.9992 15.5547 19.7797 15.428 19.5976 15.2565C19.4155 15.085 19.2759 14.8734 19.1898 14.6385L18.7763 13.487C18.6875 13.2521 18.5273 13.051 18.3181 12.912C18.109 12.7729 17.8616 12.703 17.6106 12.7121C17.3597 12.7211 17.1179 12.8086 16.9193 12.9623C16.7207 13.116 16.5754 13.3281 16.5037 13.5688L16.163 14.7252C16.0932 14.9615 15.97 15.1786 15.803 15.3599C15.6361 15.5411 15.4297 15.6816 15.1999 15.7705L14.0453 16.1821C13.8121 16.2721 13.6126 16.4321 13.474 16.6402C13.3355 16.8482 13.2648 17.0941 13.2716 17.3439C13.2792 17.5959 13.3659 17.8391 13.5195 18.039C13.673 18.2389 13.8857 18.3854 14.1272 18.4576L15.2815 18.7964C15.522 18.868 15.7423 18.9952 15.9245 19.1678C16.1068 19.3403 16.2459 19.5532 16.3307 19.7894L16.7432 20.941C16.8327 21.1734 16.9923 21.3723 17.1998 21.51"
                fill="currentColor"
              />
            </svg>
            เปิดตัวแคมเปญเลย
          </button>
          <button
            type="button"
            onClick={() => navigate('/campaign')}
            className="font-thai bg-sealight-hover border-seadark text-seadark w-full rounded-xl border-[1.5px] py-3
             text-lg font-semibold hover:bg-sealight-active hover:text-seadark-active hover:cursor-pointer hover:scale-105"
          >
            บันทึกเป็นฉบับร่าง
          </button>
          <button
            type="button"
            onClick={() => navigate('/campaign/new')}
            className="font-thai w-full py-2 text-center text-lg text-[#8e98a8] underline hover:cursor-pointer hover:scale-105"
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
