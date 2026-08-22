import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import sparklebold from '@/assets/icons/sparklebold.svg'
import StepIndicator from '@/components/stepIndicator'

type SuggestedIdea = { id: string; prompt: string }

const suggestedIdeas: SuggestedIdea[] = [
  { id: 'radius-promo', prompt: 'เพิ่มลูกค้าใหม่ในรัศมี 3 กม. งบ 200 บาท/วัน' },
  { id: 'latte-menu', prompt: 'แนะนำเมนูใหม่ Latte Caramel สำหรับสายของหวาน' },
  {
    id: 'afternoon-cold-drink',
    prompt: 'โปรเครื่องดื่มเย็นดับร้อน ช่วงบ่ายวันธรรมดา',
  },
]

const trendPrompt =
  'ใช้โอกาสฝนตกพรุ่งนี้ ทำแคมเปญเครื่องดื่มร้อน + ของหวานในย่านสีลม งบ 300 บาท/วัน'

function CampaignCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const [prompt, setPrompt] = useState(
    () => (location.state as { prompt?: string } | null)?.prompt ?? '',
  )
  const aiReply = (location.state as { aiReply?: string } | null)?.aiReply

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    navigate('/campaign/new/processing', { state: { prompt } })
  }

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => navigate('/campaign')}
          className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
        >
          <ChevronLeft className="text-amalfidark h-7 w-7" />
        </button>
        <div className="font-thai flex flex-col gap-1">
          <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            สร้างแคมเปญใหม่
          </h1>
          <p className="text-lg font-semibold text-black">
            พิมพ์สิ่งที่คุณต้องการเป็นภาษาธรรมดา น้องดี AI
            จะวางแผนแคมเปญและคำนวณตลาดให้อัตโนมัติ
          </p>
        </div>
      </div>

      <div className="mt-6">
        <StepIndicator currentStep={1} />
      </div>

      <div className="mt-6 flex flex-col items-start gap-5 md:flex-row">
        {/** Main prompt card */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 rounded-xl border border-black/20 bg-white p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
        >
          <div className="flex items-center gap-3">
            <div className="bg-citrus flex h-14 w-14 shrink-0 items-center justify-center rounded-[11px]">
              <img src={sparklebold} alt="Sparkle" className="h-9 w-9" />
            </div>
            <div className="font-thai">
              <h2 className="text-amalfidark text-2xl font-bold">
                บอกน้องดีว่าคุณอยากได้อะไร
              </h2>
              <p className="text-lg text-black">
                ไม่ต้องคิดเรื่องเทคนิค — แค่บอกเป้าหมาย AI จะจัดการที่เหลือ
              </p>
            </div>
          </div>

          {aiReply && (
            <div className="border-seadark bg-sealight mt-4 rounded-[10px] border p-4">
              <p className="font-thai text-seadark-active text-base font-semibold">
                น้องดี
              </p>
              <p className="font-thai mt-1 text-lg text-black">{aiReply}</p>
            </div>
          )}

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="เช่น: อยากเพิ่มลูกค้าใหม่ในย่านสีลม งบไม่เกิน 5,000 ต่อสัปดาห์ เน้นกลุ่มออฟฟิศกับนักศึกษา ช่วงบ่ายฝนตก..."
            className="font-thai mt-4 h-55 w-full resize-none rounded-[10px] border border-[#8E98A8] p-4 text-lg text-black outline-none placeholder:text-[#8e98a8]"
          />

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-thai bg-sealight-active text-seadark-active rounded-2xl px-4 py-2 text-lg font-medium">
                GPT ภาษาไทย
              </span>
              <span className="font-thai text-lg text-[#8e98a8]">
                ใช้เครดิต 1 ครั้ง
              </span>
            </div>
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="bg-citrus hover:bg-citrushover font-thai flex items-center gap-2 rounded-2xl px-6 py-3 text-lg font-semibold text-black shadow-md transition-all hover:scale-105 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <img src={sparklebold} alt="" className="h-5 w-5" />
              สร้างแคมเปญด้วย AI
            </button>
          </div>

          <div className="mt-6 border-t border-[#8E98A8] pt-4">
            <p className="font-thai text-lg font-semibold text-black">
              หรือเริ่มจากตัวอย่างที่น้องดีแนะนำ
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedIdeas.map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => setPrompt(idea.prompt)}
                  className="font-thai bg-sealight border-seadark-hover text-seadark-active hover:bg-sealight-hover rounded-2xl border border-dashed px-4 py-2 text-left text-base"
                >
                  {idea.prompt}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/** Right column */}
        <div className="flex w-full shrink-0 flex-col gap-5 md:w-72 lg:w-97">
          <div className="rounded-xl border border-black/20 bg-white p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <h3 className="font-thai text-amalfidark text-2xl font-bold">
              น้องดีจะช่วยอะไรบ้าง
            </h3>
            <div className="font-thai mt-3 flex flex-col gap-3 text-base text-black">
              <div className="flex items-center gap-2">
                <Users className="text-amalfidark h-5 w-5 shrink-0" />
                กำหนดกลุ่มเป้าหมายและคาดการณ์ขนาดตลาด
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="text-amalfidark h-5 w-5 shrink-0" />
                เขียนแคปชั่นและสร้างภาพโฆษณา
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-amalfidark h-5 w-5 shrink-0" />
                ปรับการเสนอราคา 24/7 ระหว่างที่คุณยุ่ง
              </div>
            </div>
          </div>

          <div className="bg-amalfihover rounded-xl p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <p className="font-thai text-citrus text-2xl font-semibold">
              เทรนด์ในพื้นที่ของคุณ
            </p>
            <p className="font-thai mt-2 text-lg font-normal text-[#e9ebf8]">
              พรุ่งนี้พยากรณ์ฝนตกในย่านสีลม ลูกค้ามักสั่งเครื่องดื่มร้อน +
              ของหวาน +34%
            </p>
            <button
              type="button"
              onClick={() => setPrompt(trendPrompt)}
              className="bg-sea font-thai hover:bg-seahover mt-4 flex items-center gap-1 rounded-2xl px-4 py-2 text-base font-semibold text-black transition-all hover:scale-105 hover:cursor-pointer"
            >
              ใช้ไอเดียนี้
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CampaignCreate
