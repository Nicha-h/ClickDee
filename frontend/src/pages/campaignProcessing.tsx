import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles } from 'lucide-react'
import StepIndicator from '@/components/stepIndicator'
import { postApiAiMessages } from '@/api/generated/client'
import { getUserId, withCredentials } from '@/lib/userId'

function errorReplyFor(status: number): string {
  if (status === 429) return 'ตอนนี้มีคนใช้งานเยอะ กรุณาลองใหม่อีกครั้งค่ะ'
  if (status === 422)
    return 'ข้อความนี้ถูกบล็อกโดยระบบตรวจสอบความปลอดภัย กรุณาลองใหม่อีกครั้งค่ะ'
  if (status === 503) return 'ระบบ AI ยังไม่พร้อมใช้งานในขณะนี้ค่ะ'
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้งค่ะ'
}

function CampaignProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const prompt = (location.state as { prompt?: string } | null)?.prompt ?? ''

  useEffect(() => {
    if (!prompt.trim() || !getUserId()) {
      navigate('/campaign/new', { replace: true })
      return
    }

    let cancelled = false
    postApiAiMessages({ text: prompt }, withCredentials())
      .then((res) => {
        if (cancelled) return
        if (res.status === 201) {
          const staged = res.data.assistantMessages.find(
            (m) =>
              m.pendingAction?.status === 'PENDING' &&
              m.pendingAction.type === 'CREATE',
          )
          if (staged?.pendingAction) {
            navigate('/campaign/new/review', {
              replace: true,
              state: { pendingAction: staged.pendingAction },
            })
            return
          }
          const aiReply =
            res.data.assistantMessages
              .map((m) => m.text)
              .filter(Boolean)
              .join('\n\n') || 'น้องดีต้องการรายละเอียดเพิ่มเติมค่ะ'
          navigate('/campaign/new', { replace: true, state: { prompt, aiReply } })
        } else {
          navigate('/campaign/new', {
            replace: true,
            state: { prompt, aiReply: errorReplyFor(res.status) },
          })
        }
      })
      .catch(() => {
        if (cancelled) return
        navigate('/campaign/new', {
          replace: true,
          state: { prompt, aiReply: errorReplyFor(0) },
        })
      })

    return () => {
      cancelled = true
    }
  }, [navigate, prompt])

  return (
    <div className="min-h-full min-w-full py-10">
      {/** Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/campaign/new')}
          className="border-amalfidark flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-105"
        >
          <ChevronLeft className="text-amalfidark h-7 w-7" />
        </button>
        <div className="font-thai flex flex-col gap-1">
          <h1 className="text-amalfidark text-2xl font-bold sm:text-3xl lg:text-4xl">
            AI กำลังคิดให้คุณอยู่...
          </h1>
          <p className="text-lg font-semibold text-black">
            พิมพ์สิ่งที่คุณต้องการเป็นภาษาธรรมดา น้องดี AI
            จะวางแผนแคมเปญและคำนวณตลาดให้อัตโนมัติ
          </p>
        </div>
      </div>

      <div className="mt-6">
        <StepIndicator currentStep={2} />
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
          น้องดีกำลังคิดให้คุณอยู่...
        </h2>
        <p className="font-thai mt-2 text-xl text-[#8e98a8]">
          จากบรีฟของคุณ AI กำลังวิเคราะห์พฤติกรรมลูกค้า เทรนด์ในพื้นที่ และ
          แคมเปญที่คล้ายกันในอุตสหกรรม
        </p>
      </div>
      <div className="h-24 w-full shrink-0"></div>
    </div>
  )
}

export default CampaignProcessing
