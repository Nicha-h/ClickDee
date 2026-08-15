import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Sparkles } from 'lucide-react'
import sparklebold from '@/assets/icons/sparklebold.svg'
import { campaigns } from '@/data/campaigns'

type SuggestedIdea = { id: string; prompt: string }

const suggestedIdeas: SuggestedIdea[] = [
  {
    id: 'discount-focus',
    prompt: 'โปรโมทส่วนลด 20% เน้นความคุ้มค่า สไตล์สดใส',
  },
  { id: 'new-menu', prompt: 'แนะนำเมนูใหม่ให้น่าลอง เน้นภาพสวยกินแล้วอยากลอง' },
  {
    id: 'limited-time',
    prompt: 'สร้างความเร่งด่วน โปรวันนี้เท่านั้น ลดจริง 25%',
  },
]

function CreativeCreate() {
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

  return <CreativeCreateView campaign={campaign} />
}

function CreativeCreateView({
  campaign,
}: {
  campaign: (typeof campaigns)[number]
}) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')

  const worstCreative = campaign.creatives.reduce((min, c) =>
    c.ctr < min.ctr ? c : min,
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    navigate(`/campaign/${campaign.id}/creative/new/processing`, {
      state: { prompt },
    })
  }

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => navigate(`/campaign/${campaign.id}/report`)}
          className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
        >
          <ChevronLeft className="text-amalfidark h-7 w-7" />
        </button>
        <div className="font-thai flex flex-col gap-1">
          <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            สร้างครีเอทีฟใหม่
          </h1>
          <p className="text-lg font-semibold text-black">
            บอกน้องดีว่าอยากได้ครีเอทีฟแบบไหน AI จะสร้างและนำไปทดสอบ A/B
            แทนที่ใบที่ทำผลงานได้น้อยที่สุด
          </p>
        </div>
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
                บอกน้องดีว่าคุณอยากได้ครีเอทีฟแบบไหน
              </h2>
              <p className="text-lg text-black">
                อธิบายไอเดีย มุมมอง หรือข้อความที่อยากสื่อ AI จะจัดการที่เหลือ
              </p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="เช่น: โปรโมทเมนูใหม่ ลาเต้คาราเมล เน้นภาพสวย บรรยากาศอบอุ่น..."
            className="font-thai mt-4 h-40 w-full resize-none rounded-[10px] border border-[#8E98A8] p-4 text-lg text-black outline-none placeholder:text-[#8e98a8]"
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
              สร้างครีเอทีฟด้วย AI
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
              ครีเอทีฟที่กำลังทดสอบอยู่
            </h3>
            <p className="font-thai mt-1 text-base text-black">
              ใบที่ CTR ต่ำที่สุดจะถูกแทนที่ด้วยครีเอทีฟใหม่
            </p>
            <div className="font-thai mt-4 flex flex-col gap-3">
              {campaign.creatives.map((creative) => {
                const isWorst = creative.rank === worstCreative.rank
                return (
                  <div
                    key={creative.rank}
                    className={`flex items-center gap-3 rounded-xl border p-2 ${
                      isWorst
                        ? 'border-[#be2c2c] bg-[rgba(190,44,44,0.05)]'
                        : 'border-[#8E98A8]'
                    }`}
                  >
                    <img
                      src={creative.image}
                      alt={creative.caption}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base text-black">
                        {creative.caption}
                      </p>
                      <p className="text-sm text-[#8e98a8]">
                        CTR {creative.ctr}%
                      </p>
                    </div>
                    {isWorst && (
                      <span className="shrink-0 rounded-full bg-[#be2c2c] px-2 py-0.5 text-sm font-semibold text-white">
                        จะถูกแทนที่
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-amalfihover rounded-xl p-5 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-2">
              <Sparkles className="text-citrus h-6 w-6 shrink-0" />
              <p className="font-thai text-citrus text-xl font-semibold">
                AI ทดสอบอัตโนมัติ
              </p>
            </div>
            <p className="font-thai mt-2 text-lg font-normal text-[#e9ebf8]">
              หลังสร้างเสร็จ ครีเอทีฟใหม่จะเริ่มทดสอบทันที
              และปรับสัดส่วนการแสดงผลอัตโนมัติตามผลลัพธ์
            </p>
          </div>
        </div>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CreativeCreate
