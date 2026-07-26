import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import coffee from '@/assets/coffee.svg'
import rocket from '@/assets/rocket.svg'
import ppl from '@/assets/ppl.svg'
import increase from '@/assets/increase.svg'
import star from '@/assets/starcircle.svg'
import cash from '@/assets/cash.svg'
import click from '@/assets/click.svg'
import { ArrowRight, ChevronDown } from 'lucide-react'
import rain from '@/assets/campaign-rain-promo.png'
import milo from '@/assets/campaign-milo-promo.jpg'
import trend1 from '@/assets/trend1.png'
import trend2 from '@/assets/trend2.png'
import sparklebold from '@/assets/sparklebold.svg'
import facebook from '@/assets/facebook.svg'
import salesChart from '@/assets/home-sales-chart.png'

const salesRangeOptions = [
  { value: '7d', label: '7 วัน' },
  { value: 'monthly', label: 'รายเดือน' },
  { value: 'yearly', label: 'รายปี' },
]

function Home() {
  const navigate = useNavigate()
  {
    /** Summary data PLACEHOLDER*/
  }
  const reach = 12450
  const clickNum = 842
  const usedBudget = 12400
  const ROI = 11.5
  const handleClick = () => {
    navigate('/campaign/new')
  }
  const [salesRange, setSalesRange] = useState(salesRangeOptions[0])
  const [isSalesRangeOpen, setIsSalesRangeOpen] = useState(false)
  const salesRangeRef = useRef<HTMLDivElement>(null)

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
  return (
    <div className="min-h-full w-full pb-10">
      {/** Welcome Message + create campaign btn*/}
      <div className="flex flex-row items-center justify-between gap-5 p-10">
        <div className="font-thai flex flex-col items-start justify-start gap-2 font-semibold">
          <div className="text-amalfidark text-4xl">
            สวัสดีตอนเช้า ☀️ ทีมLulu!
          </div>
          <div className="text-xl">
            วันนี้ AI ดูแลโฆษณาให้คุณอยู่นะ
            ระบบกำลังทำงานอย่างเต็มที่เพื่อยอดขายของคุณ
          </div>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => handleClick()}
            className="bg-seaactive hover:bg-seadark font-thai rounded-[19px] px-12 py-6 text-2xl font-semibold text-white shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:cursor-pointer hover:shadow-lg"
          >
            <img
              src={rocket}
              alt="Rocket"
              className="mr-4 -ml-2 inline-block h-10 w-10 text-white"
            />
            สร้างแคมเปญใหม่
          </button>
        </div>
      </div>
      {/** AI status box*/}
      <div className="bg-sealight border-seadark ml-10 flex h-60 w-7xl flex-row items-center justify-between rounded-xl border-2 px-15 shadow-md">
        <div className="flex flex-1 flex-col gap-4">
          {/** AI Agent Status + time update */}
          <div className="font-thai -mt-4 flex w-full flex-row items-center justify-start gap-2 font-semibold">
            {/** AI Agent Status TODO: Make this relate to the real AI status [active/inactive/error] with relative colors*/}
            <div className="text-amalfi flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>
              AI Agent · กำลังทำงาน
            </div>
            <h2 className="ml-5 text-sm">อัปเดทล่าสุด 2 ชั่วโมงที่แล้ว</h2>
          </div>
          {/** filler msg*/}
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="font-thai text-amalfidark text-2xl font-semibold">
              วันนี้ น้องดีดูแลโฆษณาให้คุณอยู่นะคะ ☕
            </div>
            <div className="font-thai text-amalfi text-lg">
              ระบบกำลังทำงานเต็มที่เพื่อยอดขายของคุณ — วิเคราะห์ตลาด ปรับงบ
              และเขียนโฆษณาให้อัตโนมัติ แค่คลิกเดียว ก็สร้างแคมเปญใหม่ได้เลย
            </div>
          </div>
        </div>
        {/** coffee cup */}
        <div className="mr-6 ml-26 shrink-0">
          <img src={coffee} alt="Coffee" className="h-40 w-40" />
        </div>
      </div>
      {/** summary boxes*/}
      {/** TODO: Replace placeholder data with real-time metrics. Replace values with a variable instead of texts*/}
      <div className="mt-10 ml-10 flex h-45 w-7xl flex-row items-center justify-between gap-5">
        <div className="h-full w-75 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row p-4 text-2xl font-semibold">
            <img src={ppl} alt="People" className="mr-2 inline-block h-9 w-9" />
            <h2 className="font-thai text-amalfi font-semibold">ยอดเข้าถึง</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-3xl font-bold">
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
        <div className="h-full w-75 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai text-amalfi flex flex-row p-4 text-2xl font-semibold">
            <img
              src={click}
              alt="click"
              className="mr-2 inline-block h-9 w-9"
            />
            <h2 className="font-thai text-amalfi font-semibold">คลิก</h2>
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-citrusdark text-3xl font-bold">
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
        <div className="h-full w-75 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
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
            <p className="text-citrusdark text-3xl font-bold">
              ฿{usedBudget.toLocaleString()}
            </p>
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-black">
              ของงบรายเดือน
            </p>
          </div>
        </div>
        <div className="bg-amalfi h-full w-75 rounded-xl border-2 border-[#8E98A8] px-4 py-2 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
          <div className="font-thai flex flex-row justify-between p-4 text-2xl font-semibold text-white">
            <h2 className="font-thai font-semibold">ROI</h2>
            <img
              src={star}
              alt="Budget usage"
              className="mr-2 inline-block h-9 w-9"
            />
          </div>
          <div className="flex flex-row items-center justify-start px-4">
            <p className="text-3xl font-bold text-white">{ROI.toFixed(1)}x</p>
          </div>
          <div className="px-4">
            <p className="font-thai mt-2 text-lg font-semibold text-white">
              ผลตอบแทนดีเยี่ยม
            </p>
          </div>
        </div>
      </div>
      {/** Campaign boxes + sales overview + connected channels (left) / AI recommendations + local trend (right) */}
      <div className="mt-10 ml-10 flex flex-row items-start gap-5">
        {/** Left column */}
        <div className="flex w-3xl flex-col gap-8">
          <div className="flex h-64 w-full flex-col">
            <div className="font-thai flex flex-row items-center justify-between gap-2 p-4 text-2xl font-semibold">
              <h2 className="font-thai text-amalfidark text-3xl font-semibold">
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
            <div className="items-between flex h-60 w-full flex-row justify-start rounded-xl border-2 border-[#8E98A8] px-6 py-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
              <img
                src={rain}
                alt="Campaign1"
                className="h-15 w-15 rounded-2xl object-cover"
              />
              <div className="flex flex-col px-4">
                <h2 className="font-thai text-2xl font-semibold text-black">
                  โปรหน้าฝน 2026 ลด 20%
                </h2>
                <h3 className="font-thai text-lg text-black">
                  ROI: {ROI.toFixed(1)}x
                </h3>
              </div>
              <div className="ml-auto flex flex-row items-center justify-end">
                <img src={trend1} alt="Trend1" className="h-15 w-50" />
              </div>
            </div>
            <div className="items-between mt-5 flex h-60 w-full flex-row justify-start rounded-xl border-2 border-[#8E98A8] px-6 py-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
              <img
                src={milo}
                alt="Campaign2"
                className="h-15 w-15 rounded-2xl object-cover"
              />
              <div className="flex flex-col px-4">
                <h2 className="font-thai text-2xl font-semibold text-black">
                  โปรไมโล 2026 ลด 60%
                </h2>
                <h3 className="font-thai text-lg text-black">
                  ROI: {ROI.toFixed(1)}x
                </h3>
              </div>
              <div className="ml-auto flex flex-row items-center justify-end">
                <img src={trend2} alt="Trend2" className="h-15 w-50" />
              </div>
            </div>
            <div className="flex h-full w-full flex-row items-center justify-start gap-5 overflow-x-auto"></div>
          </div>

          {/** Sales overview */}
          {/* TODO: replace with a real sales chart once analytics data is available */}
          <div className="mt-8 w-full rounded-xl border-2 border-[#8E98A8] px-10 py-6 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <div className="flex flex-row items-center justify-between">
              <div>
                <h2 className="font-thai text-amalfidark text-2xl font-semibold">
                  ภาพรวมยอดขาย
                </h2>
                <p className="font-thai mt-1 text-lg text-[#8E98A8]">
                  เทียบกับสัปดาห์ก่อน{' '}
                  <span className="font-semibold text-[#519b5c]">+18.4%</span>
                </p>
              </div>
              {/* TODO: wire up real date-range selection for the sales chart */}
              <div className="relative" ref={salesRangeRef}>
                <button
                  onClick={() => setIsSalesRangeOpen((prev) => !prev)}
                  className="font-thai flex items-center gap-1 rounded-full border border-[#8E98A8] px-4 py-1 text-base text-black"
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
            <img src={salesChart} alt="ภาพรวมยอดขาย" className="mt-4 w-full" />
          </div>

          {/** Connected channels */}
          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <h2 className="font-thai text-amalfidark text-2xl font-semibold">
              ช่องทางที่เชื่อมต่อ
            </h2>
            <p className="font-thai mt-1 text-base text-black">
              ClickDee ส่งโฆษณาออกไปยังแพลตฟอร์มเหล่านี้ให้คุณอัตโนมัติ
            </p>
            <div className="mt-4 flex w-58 flex-row items-center gap-3 rounded-[10px] border border-[#8E98A8] p-4">
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
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                  </span>
                </div>
                <p className="font-thai text-base text-[#787878]">12 แคมเปญ</p>
              </div>
            </div>
          </div>
        </div>

        {/** Right column */}
        <div className="mr-10 flex w-150 flex-col gap-5">
          {/** AI recommendations */}
          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <div className="flex flex-row items-center gap-3">
              <div className="bg-citrus rounded-xl p-3 shadow-md">
                <img src={sparklebold} alt="Sparkle" className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-thai text-amalfidark text-2xl font-semibold">
                  น้องดีแนะนำให้คุณ
                </h2>
                <p className="font-thai text-base text-black">
                  2 สิ่งที่ทำได้ใน 30 วินาที
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="rounded-[10px] border border-[#8E98A8] px-5 py-4">
                <p className="font-thai text-xl font-semibold text-black">
                  ครีเอทีฟใหม่พร้อมทดสอบ
                </p>
                <p className="font-thai mt-1 text-base text-black">
                  AI สร้าง 3 ภาพใหม่สำหรับเมนูลาเต้คาราเมล กดดูและเริ่ม A/B Test
                  ได้เลย
                </p>
                {/* TODO: wire up real action once backend exists */}
                <button className="bg-sealight-hover border-seadark text-seadark font-thai mt-5 flex items-center gap-1 rounded-full border px-7 py-1 text-base">
                  เริ่มเลย
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-[10px] border border-[#8E98A8] px-5 py-4">
                <p className="font-thai text-xl font-semibold text-black">
                  งบใกล้หมดสำหรับโปรไมโล
                </p>
                <p className="font-thai mt-1 text-base text-black">
                  ใช้ไป 90% แล้ว — AI แนะนำให้เพิ่ม ฿2,000 เพื่อให้รันต่ออีก 3
                  วัน
                </p>
                {/* TODO: wire up real action once backend exists */}
                <button className="bg-sealight-hover border-seadark text-seadark font-thai mt-5 flex items-center gap-1 rounded-full border px-7 py-1 text-base">
                  เพิ่มงบ
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/** Local trend */}
          <div className="w-full rounded-xl border-2 border-[#8E98A8] p-5 pb-8 shadow-[0_5px_5px_rgba(0,0,0,0.25)]/30">
            <p className="font-thai text-xl font-semibold text-black">
              เทรนด์ในย่านของคุณ
            </p>
            <p className="font-thai text-amalfidark mt-2 text-lg font-bold italic">
              ลูกค้าในเขตสีลม-สาทร ค้นหาคำว่า "คาเฟ่ใกล้ฉัน" เพิ่มขึ้น +47%
              สัปดาห์นี้
            </p>
            <div className="mt-4 flex justify-end gap-3">
              {/* TODO: wire up real action once backend exists */}
              <button className="bg-seadark font-thai mt-3 flex h-12 w-36 items-center gap-1 rounded-full px-7 py-1 text-xl text-white">
                คว้าโอกาส
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default Home
