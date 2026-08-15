import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Sparkles } from 'lucide-react'
import campaignReportCreative1 from '@/assets/placeholders/campaign-report-creative-1.jpg'
import campaignReportCreative2 from '@/assets/placeholders/campaign-report-creative-2.jpg'
import campaignReportCreative3 from '@/assets/placeholders/campaign-report-creative-3.jpg'
import type { Creative } from '@/data/campaigns'

const PROCESSING_DELAY_MS = 3000

const placeholderImages = [
  campaignReportCreative1,
  campaignReportCreative2,
  campaignReportCreative3,
]

type NewCreative = Omit<Creative, 'rank' | 'badgeBorderColor'>

function CreativeProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const { campaignId } = useParams()
  const prompt = (location.state as { prompt?: string } | null)?.prompt ?? ''

  useEffect(() => {
    const timeout = setTimeout(() => {
      const newCreative: NewCreative = {
        image:
          placeholderImages[
            Math.floor(Math.random() * placeholderImages.length)
          ],
        caption: prompt,
        impressions: Math.floor(500 + Math.random() * 1500),
        ctr: Math.round((3 + Math.random() * 3) * 100) / 100,
      }
      navigate(`/campaign/${campaignId}/report`, {
        replace: true,
        state: { newCreative },
      })
    }, PROCESSING_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [navigate, campaignId, prompt])

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(`/campaign/${campaignId}/creative/new`)}
          className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-105"
        >
          <ChevronLeft className="text-amalfidark h-7 w-7" />
        </button>
        <div className="font-thai flex flex-col gap-1">
          <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            AI กำลังสร้างครีเอทีฟให้คุณอยู่...
          </h1>
          <p className="text-lg font-semibold text-black">
            น้องดีกำลังออกแบบภาพและแคปชั่นจากไอเดียของคุณ
          </p>
        </div>
      </div>

      <div className="bg-sealight mt-6 flex h-113 flex-col items-center justify-center rounded-xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="relative flex h-35 w-35 items-center justify-center">
          <span className="bg-sea absolute inline-flex h-28 w-28 animate-ping rounded-full opacity-60" />
          <span className="bg-sea absolute inline-flex h-28 w-28 animate-ping rounded-full opacity-60 [animation-delay:0.5s]" />
          <span className="bg-sea relative flex h-28 w-28 animate-[breathe_2.4s_ease-in-out_infinite] items-center justify-center rounded-full shadow-lg">
            <Sparkles className="h-14 w-14 animate-[spin_6s_linear_infinite] text-white" />
          </span>
        </div>
        <h2 className="font-thai text-amalfidark mt-6 text-xl font-bold sm:text-2xl lg:text-3xl">
          น้องดีกำลังสร้างครีเอทีฟให้คุณอยู่...
        </h2>
        <p className="font-thai mt-2 text-xl text-[#8e98a8]">
          AI กำลังวิเคราะห์ครีเอทีฟที่ทำผลงานดีที่สุด
          เพื่อสร้างใบใหม่ที่มีโอกาสชนะการทดสอบ
        </p>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CreativeProcessing
