import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Sparkles } from 'lucide-react'
import defaultCampaignImage from '@/assets/decorative/default campaign.png'
import type { Creative } from '@/data/campaigns'
import { postApiAiCampaignsIdCreative } from '@/api/generated/client'
import { withCredentials } from '@/lib/userId'

type NewCreative = Omit<Creative, 'rank' | 'badgeBorderColor'>

function CreativeProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const { campaignId } = useParams()
  const prompt = (location.state as { prompt?: string } | null)?.prompt ?? ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) return
    let cancelled = false

    const run = async () => {
      setError(null)
      try {
        const res = await postApiAiCampaignsIdCreative(
          campaignId,
          { prompt },
          withCredentials(),
        )
        if (cancelled) return
        if (res.status === 200) {
          const newCreative: NewCreative = {
            image: defaultCampaignImage,
            caption: res.data.caption,
            impressions: Math.floor(500 + Math.random() * 1500),
            ctr: Math.round((3 + Math.random() * 3) * 100) / 100,
          }
          navigate(`/campaign/${campaignId}/report`, {
            replace: true,
            state: { newCreative },
          })
        } else {
          setError('ไม่สามารถสร้างครีเอทีฟได้ กรุณาลองใหม่อีกครั้ง')
        }
      } catch {
        if (!cancelled) {
          setError('ไม่สามารถสร้างครีเอทีฟได้ กรุณาลองใหม่อีกครั้ง')
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
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

      {error ? (
        <div className="bg-sealight mt-6 flex h-113 flex-col items-center justify-center gap-4 rounded-xl shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
          <p className="font-thai text-xl text-[#be2c2c]">{error}</p>
          <button
            type="button"
            onClick={() =>
              navigate(`/campaign/${campaignId}/creative/new`, {
                state: { prompt },
              })
            }
            className="bg-citrus hover:bg-citrushover font-thai rounded-2xl px-6 py-3 text-lg font-semibold text-black transition-all hover:scale-105 hover:cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : (
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
      )}
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CreativeProcessing
