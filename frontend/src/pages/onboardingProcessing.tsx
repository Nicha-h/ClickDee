import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import OnboardingTopbar from '@/components/onboardingTopbar'
import type { OnboardingAnswers } from '@/components/onboardingWizard'
import { postApiOnboardingFollowupQuestion } from '@/api/generated/client'
import type { FollowupQuestionRequestBusinessProfile } from '@/api/generated/client'

const MIN_DISPLAY_MS = 1200

type ProcessingState = {
  answers?: OnboardingAnswers
  email?: string
  password?: string
}

function asString(value: string | string[] | undefined) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function toBusinessProfile(
  answers: OnboardingAnswers,
): FollowupQuestionRequestBusinessProfile {
  return {
    businessName: asString(answers.businessName),
    category:
      answers.category === 'other'
        ? asString(answers.categoryOther)
        : asString(answers.category),
    goal: asString(answers.goal),
    signatureProduct: asString(answers.signatureProduct),
    location: asString(answers.location),
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function OnboardingProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const { answers, email, password } =
    (location.state as ProcessingState | null) ?? {}

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const businessProfile = toBusinessProfile(answers ?? {})

    const run = async () => {
      const [firstFollowup] = await Promise.all([
        postApiOnboardingFollowupQuestion(
          { businessProfile, previousAnswers: [] },
          { signal: controller.signal },
        )
          .then((res) =>
            res.status === 200 ? res.data : { done: true, question: null },
          )
          .catch(() => ({ done: true, question: null })),
        delay(MIN_DISPLAY_MS),
      ])
      if (cancelled) return
      navigate('/onboarding/personalize', {
        state: {
          answers,
          email,
          password,
          businessProfile,
          firstQuestion: firstFollowup.done ? null : firstFollowup.question,
        },
        replace: true,
      })
    }

    run()
    return () => {
      cancelled = true
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <OnboardingTopbar />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center md:px-8 lg:px-10">
        <div className="relative flex h-35 w-35 items-center justify-center">
          <span className="bg-sea absolute inline-flex h-28 w-28 animate-ping rounded-full opacity-60" />
          <span className="bg-sea absolute inline-flex h-28 w-28 animate-ping rounded-full opacity-60 [animation-delay:0.5s]" />
          <span className="bg-sea relative flex h-28 w-28 animate-[breathe_2.4s_ease-in-out_infinite] items-center justify-center rounded-full shadow-lg">
            <Sparkles className="h-14 w-14 animate-[spin_6s_linear_infinite] text-white" />
          </span>
        </div>
        <div className="font-thai flex flex-col gap-2">
          <h1 className="text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
            กำลังปรับแต่งระบบให้เหมาะกับธุรกิจของคุณ...
          </h1>
          <p className="max-w-150 text-lg text-[#8e98a8]">
            AI กำลังวิเคราะห์คำตอบของคุณ
            เพื่อเตรียมคำถามเพิ่มเติมที่ช่วยให้ระบบเข้าใจธุรกิจของคุณมากขึ้น
          </p>
        </div>
      </div>
    </div>
  )
}

export default OnboardingProcessing
