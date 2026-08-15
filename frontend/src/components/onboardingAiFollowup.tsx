import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import OnboardingProgress from '@/components/onboardingProgress'
import { postApiOnboardingFollowupQuestion } from '@/api/generated/client'
import type { FollowupQuestionRequestBusinessProfile } from '@/api/generated/client'

export type FollowupQa = { question: string; answer: string }

export const MAX_FOLLOWUP_QUESTIONS = 5

type OnboardingAiFollowupProps = {
  businessProfile: FollowupQuestionRequestBusinessProfile
  initialQuestion: string | null
  onComplete: (qas: FollowupQa[], consent: boolean) => void
}

function OnboardingAiFollowup({
  businessProfile,
  initialQuestion,
  onComplete,
}: OnboardingAiFollowupProps) {
  const [phase, setPhase] = useState<'consent' | 'question'>('consent')
  const [consentChecked, setConsentChecked] = useState(false)
  const [qas, setQas] = useState<FollowupQa[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [answerText, setAnswerText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialQuestion === null) {
      onComplete([], false)
    }
    // Only relevant on first mount — if the AI had nothing to ask, skip
    // this step entirely rather than showing an empty consent screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (initialQuestion === null) return null

  const startFollowups = () => {
    setPhase('question')
  }

  const skipEntirely = () => {
    onComplete([], false)
  }

  const finishEarly = () => {
    onComplete(qas, true)
  }

  const goNext = async () => {
    const answer = answerText.trim()
    if (!answer || !currentQuestion) return

    const nextQas = [...qas, { question: currentQuestion, answer }]
    setQas(nextQas)
    setAnswerText('')

    if (nextQas.length >= MAX_FOLLOWUP_QUESTIONS) {
      onComplete(nextQas, true)
      return
    }

    setIsLoading(true)
    try {
      const res = await postApiOnboardingFollowupQuestion({
        businessProfile,
        previousAnswers: nextQas,
      })
      if (res.status === 200 && !res.data.done && res.data.question) {
        setCurrentQuestion(res.data.question)
      } else {
        onComplete(nextQas, true)
      }
    } catch {
      onComplete(nextQas, true)
    } finally {
      setIsLoading(false)
    }
  }

  if (phase === 'consent') {
    return (
      <div className="flex w-full max-w-190 flex-col items-center gap-8">
        <div className="font-thai flex w-full flex-col items-center gap-2.5 text-center">
          <span className="bg-sealight text-seadark-active font-thai mb-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            คำถามเพิ่มเติมจาก AI
          </span>
          <h1 className="text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
            อยากให้ AI รู้จักธุรกิจของคุณมากขึ้นไหม?
          </h1>
          <p className="max-w-150 text-base text-[#8e98a8]">
            คำตอบเพิ่มเติมที่คุณให้จะถูกเข้ารหัสและเก็บไว้เป็นความจำของ AI
            เพื่อปรับแต่งแคมเปญให้เหมาะกับธุรกิจของคุณเท่านั้น
            คุณสามารถลบข้อมูลนี้ได้ทุกเมื่อโดยการลบบัญชี
          </p>
        </div>

        <label className="border-amalfilight-hover font-thai flex w-full max-w-130 items-start gap-3 rounded-xl border-[1.5px] p-5 text-left hover:cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="accent-amalfi mt-0.5 h-5 w-5 shrink-0 hover:cursor-pointer"
          />
          <span className="text-sm text-[#1F2937]">
            ฉันยินยอมให้ ClickDee เก็บคำตอบเพิ่มเติมนี้ไว้เป็นความจำของ AI
            เพื่อใช้ปรับแต่งแคมเปญโฆษณาให้ฉัน
          </span>
        </label>

        <div className="flex h-14 w-full max-w-130 items-center justify-between gap-4">
          <button
            type="button"
            onClick={skipEntirely}
            className="font-thai text-base text-[#8e98a8] hover:cursor-pointer hover:underline"
          >
            ข้ามขั้นตอนนี้ทั้งหมด
          </button>
          <button
            type="button"
            onClick={startFollowups}
            disabled={!consentChecked}
            className="bg-citrus hover:bg-citrushover text-amalfi font-thai flex h-14 w-45 items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all hover:scale-105 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            เริ่มเลย
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full max-w-190 flex-col items-center gap-8">
      <OnboardingProgress
        current={qas.length + 1}
        total={MAX_FOLLOWUP_QUESTIONS}
      />

      <div className="font-thai flex w-full flex-col items-center gap-2.5 text-center">
        <span className="bg-sealight text-seadark-active font-thai mb-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          คำตอบนี้จะถูกส่งให้ AI ช่วยปรับแต่งระบบให้คุณ
        </span>
        <h1 className="text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
          {currentQuestion}
        </h1>
      </div>

      <textarea
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        placeholder="พิมพ์คำตอบของคุณที่นี่..."
        rows={3}
        disabled={isLoading}
        className="font-thai border-amalfilight-hover focus:border-amalfi w-full resize-none rounded-xl border-[1.5px] p-5 text-base outline-none placeholder:text-[#8e98a8] disabled:opacity-50"
      />

      <div className="flex h-14 w-full items-center justify-between gap-4">
        <button
          type="button"
          onClick={finishEarly}
          disabled={isLoading}
          className="font-thai text-base text-[#8e98a8] hover:cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          จบตอนนี้
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!answerText.trim() || isLoading}
          className="bg-citrus hover:bg-citrushover text-amalfi font-thai flex h-14 w-45 items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all hover:scale-105 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? 'กำลังส่ง...' : 'ถัดไป'}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default OnboardingAiFollowup
