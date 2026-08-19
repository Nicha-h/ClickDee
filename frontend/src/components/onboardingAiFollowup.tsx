import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import OnboardingProgress from '@/components/onboardingProgress'
import OnboardingChoiceCard from '@/components/onboardingChoiceCard'
import { postApiOnboardingFollowupQuestion } from '@/api/generated/client'
import type { FollowupQuestionRequestBusinessProfile } from '@/api/generated/client'

export type FollowupQa = { question: string; answer: string }

export type FollowupQuestion = {
  text: string
  type: 'text' | 'choice'
  choices: string[] | null
}

export const MAX_FOLLOWUP_QUESTIONS = 5

const OTHER_CHOICE_ID = '__other__'

type OnboardingAiFollowupProps = {
  businessProfile: FollowupQuestionRequestBusinessProfile
  initialQuestion: FollowupQuestion | null
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
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [otherText, setOtherText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialQuestion === null) {
      onComplete([], false)
    }
    // Only relevant on first mount — if the AI had nothing to ask, skip
    // this step entirely rather than showing an empty consent screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (initialQuestion === null || currentQuestion === null) return null

  const isOtherSelected = selectedChoice === OTHER_CHOICE_ID
  const hasValidAnswer =
    currentQuestion.type === 'choice'
      ? selectedChoice !== null &&
        (!isOtherSelected || otherText.trim().length > 0)
      : answerText.trim().length > 0

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
    const answer =
      currentQuestion.type === 'choice'
        ? (isOtherSelected ? otherText.trim() : (selectedChoice ?? ''))
        : answerText.trim()
    if (!answer) return

    const nextQas = [...qas, { question: currentQuestion.text, answer }]
    setQas(nextQas)
    setAnswerText('')
    setSelectedChoice(null)
    setOtherText('')

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
        setCurrentQuestion({
          text: res.data.question,
          type: res.data.type,
          choices: res.data.choices,
        })
      } else {
        onComplete(nextQas, true)
      }
    } catch (err) {
      console.error(
        'Onboarding follow-up question request failed; ending the AI follow-up flow early.',
        err,
      )
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
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="bg-sea flex h-12 w-12 animate-[breathe_2.4s_ease-in-out_infinite] items-center justify-center rounded-full shadow-lg">
              <Sparkles className="h-6 w-6 animate-[spin_2s_linear_infinite] text-white" />
            </span>
            <p className="text-amalfidark text-base font-medium">
              AI กำลังคิดคำถามถัดไป...
            </p>
          </div>
        ) : (
          <>
            <span className="bg-sealight text-seadark-active font-thai mb-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              คำตอบนี้จะถูกส่งให้ AI ช่วยปรับแต่งระบบให้คุณ
            </span>
            <h1 className="text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
              {currentQuestion.text}
            </h1>
          </>
        )}
      </div>

      {currentQuestion.type === 'choice' && currentQuestion.choices ? (
        <div
          className={`flex w-full flex-col items-center gap-4 ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
        >
          <div className="flex w-full flex-wrap justify-center gap-4">
            {currentQuestion.choices.map((choice) => (
              <OnboardingChoiceCard
                key={choice}
                label={choice}
                selected={selectedChoice === choice}
                onClick={() => setSelectedChoice(choice)}
              />
            ))}
            <OnboardingChoiceCard
              label="อื่นๆ (พิมพ์เอง)"
              selected={isOtherSelected}
              onClick={() => setSelectedChoice(OTHER_CHOICE_ID)}
            />
          </div>
          {isOtherSelected && (
            <input
              autoFocus
              type="text"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (otherText.trim() && !isLoading) goNext()
                }
              }}
              placeholder="พิมพ์คำตอบของคุณ..."
              className="font-thai border-amalfilight-hover focus:border-amalfi h-13 w-full max-w-100 animate-[fade-in_0.2s_ease-out] rounded-xl border-[1.5px] px-5 text-base outline-none placeholder:text-[#8e98a8]"
            />
          )}
        </div>
      ) : (
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (answerText.trim() && !isLoading) goNext()
            }
          }}
          placeholder="พิมพ์คำตอบของคุณที่นี่..."
          rows={3}
          disabled={isLoading}
          className="font-thai border-amalfilight-hover focus:border-amalfi w-full resize-none rounded-xl border-[1.5px] p-5 text-base outline-none placeholder:text-[#8e98a8] disabled:opacity-50"
        />
      )}

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
          disabled={!hasValidAnswer || isLoading}
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
