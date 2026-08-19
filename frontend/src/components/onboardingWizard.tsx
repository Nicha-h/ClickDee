import { useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import OnboardingProgress from '@/components/onboardingProgress'
import OnboardingChoiceCard from '@/components/onboardingChoiceCard'
import type { OnboardingStepConfig } from '@/data/onboarding'

export type OnboardingAnswers = Record<string, string | string[]>

type OnboardingWizardProps = {
  steps: OnboardingStepConfig[]
  initialAnswers?: OnboardingAnswers
  aiLabeled?: boolean
  onComplete: (answers: OnboardingAnswers) => void
}

function OnboardingWizard({
  steps,
  initialAnswers,
  aiLabeled,
  onComplete,
}: OnboardingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => {
    const seeded: OnboardingAnswers = { ...(initialAnswers ?? {}) }
    for (const s of steps) {
      if (s.id in seeded || s.type !== 'choice') continue
      const defaults = s.choices
        .filter((choice) => choice.defaultSelected)
        .map((choice) => choice.id)
      if (defaults.length === 0) continue
      seeded[s.id] = s.multiple ? defaults : defaults[0]
    }
    return seeded
  })
  const [otherText, setOtherText] = useState<Record<string, string>>({})

  const step = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  const selectedOtherChoice =
    step.type === 'choice'
      ? step.choices.find(
          (choice) => choice.other && answers[step.id] === choice.id,
        )
      : undefined

  const isStepValid = (() => {
    if (step.type === 'fill-in') {
      if (step.required === false) return true
      return Boolean((answers[step.id] as string | undefined)?.trim())
    }
    const value = answers[step.id]
    if (step.multiple) {
      return Array.isArray(value) && value.length > 0
    }
    if (!value) return false
    if (selectedOtherChoice) {
      return Boolean(otherText[step.id]?.trim())
    }
    return true
  })()

  const selectSingleChoice = (choiceId: string) => {
    setAnswers((prev) => ({ ...prev, [step.id]: choiceId }))
  }

  const toggleMultiChoice = (choiceId: string) => {
    setAnswers((prev) => {
      const current = (prev[step.id] as string[] | undefined) ?? []
      const next = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId]
      return { ...prev, [step.id]: next }
    })
  }

  const goNext = () => {
    const finalAnswers = selectedOtherChoice
      ? { ...answers, [`${step.id}Other`]: otherText[step.id] ?? '' }
      : answers
    if (isLastStep) {
      onComplete(finalAnswers)
      return
    }
    setAnswers(finalAnswers)
    setStepIndex((index) => index + 1)
  }

  const goBack = () => setStepIndex((index) => Math.max(0, index - 1))

  const goSkip = () => {
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[step.id]
      return next
    })
    setStepIndex((index) => index + 1)
  }

  return (
    <div className="flex w-full max-w-190 flex-col items-center gap-8">
      <OnboardingProgress current={stepIndex + 1} total={steps.length} />

      <div className="font-thai flex w-full flex-col items-center gap-2.5 text-center">
        {aiLabeled && (
          <span className="bg-sealight text-seadark-active font-thai mb-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            คำตอบนี้จะถูกส่งให้ AI ช่วยปรับแต่งระบบให้คุณ
          </span>
        )}
        <h1 className="text-amalfidark text-xl font-bold sm:text-2xl lg:text-3xl">
          {step.question}
        </h1>
        <p className="text-base text-[#8e98a8]">{step.subtext}</p>
      </div>

      {step.type === 'fill-in' ? (
        step.multiline ? (
          <textarea
            value={(answers[step.id] as string | undefined) ?? ''}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [step.id]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (isStepValid) goNext()
              }
            }}
            placeholder={step.placeholder}
            rows={3}
            className="font-thai border-amalfilight-hover focus:border-amalfi w-full resize-none rounded-xl border-[1.5px] p-5 text-base outline-none placeholder:text-[#8e98a8]"
          />
        ) : (
          <input
            type="text"
            value={(answers[step.id] as string | undefined) ?? ''}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [step.id]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (isStepValid) goNext()
              }
            }}
            placeholder={step.placeholder}
            className="font-thai border-amalfilight-hover focus:border-amalfi h-15 w-full rounded-xl border-[1.5px] px-5 text-base outline-none placeholder:text-[#8e98a8]"
          />
        )
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full flex-wrap justify-center gap-4">
            {step.choices.map((choice) => {
              const selected = step.multiple
                ? ((answers[step.id] as string[] | undefined) ?? []).includes(
                    choice.id,
                  )
                : answers[step.id] === choice.id
              return (
                <OnboardingChoiceCard
                  key={choice.id}
                  label={choice.label}
                  icon={choice.icon}
                  iconSrc={choice.iconSrc}
                  selected={selected}
                  comingSoon={choice.comingSoon}
                  onClick={() =>
                    step.multiple
                      ? toggleMultiChoice(choice.id)
                      : selectSingleChoice(choice.id)
                  }
                />
              )
            })}
          </div>
          {selectedOtherChoice && (
            <input
              autoFocus
              type="text"
              value={otherText[step.id] ?? ''}
              onChange={(e) =>
                setOtherText((prev) => ({
                  ...prev,
                  [step.id]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (isStepValid) goNext()
                }
              }}
              placeholder="ระบุประเภทธุรกิจของคุณ"
              className="font-thai border-amalfilight-hover focus:border-amalfi h-13 w-full max-w-100 animate-[fade-in_0.2s_ease-out] rounded-xl border-[1.5px] px-5 text-base outline-none placeholder:text-[#8e98a8]"
            />
          )}
        </div>
      )}

      <div className="flex h-14 w-full items-center justify-between gap-4">
        {isLastStep ? (
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0}
            className="font-thai text-base text-[#8e98a8] hover:cursor-pointer hover:underline disabled:invisible"
          >
            ย้อนกลับ
          </button>
        ) : (
          <button
            type="button"
            onClick={goSkip}
            className="font-thai text-base text-[#8e98a8] hover:cursor-pointer hover:underline"
          >
            ข้ามขั้นตอนนี้
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!isStepValid}
          className="bg-citrus hover:bg-citrushover text-amalfi font-thai flex h-14 w-45 items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all hover:scale-105 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLastStep ? 'เสร็จสิ้น' : 'ถัดไป'}
          {isLastStep && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export default OnboardingWizard
