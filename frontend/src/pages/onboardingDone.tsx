import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, PartyPopper } from 'lucide-react'
import type { OnboardingAnswers } from '@/components/onboardingWizard'
import OnboardingTopbar from '@/components/onboardingTopbar'
import { AI_FOLLOWUP_STEPS, ONBOARDING_STEPS } from '@/data/onboarding'
import ellipseTop from '@/assets/decorative/welcome-ellipse-top.svg'
import ellipseBottom from '@/assets/decorative/welcome-ellipse-bottom.svg'

const ALL_STEPS = [...ONBOARDING_STEPS, ...AI_FOLLOWUP_STEPS]

type SummaryRow = { label: string; value: string }

function buildSummaryRows(answers: OnboardingAnswers): SummaryRow[] {
  return ALL_STEPS.flatMap((step): SummaryRow[] => {
    const value = answers[step.id]

    if (step.type === 'fill-in') {
      const text = (value as string | undefined)?.trim()
      return text ? [{ label: step.summaryLabel, value: text }] : []
    }

    if (value === undefined) return []
    const ids = Array.isArray(value) ? value : [value]
    const labels = ids
      .map((id) => {
        const choice = step.choices.find((c) => c.id === id)
        if (!choice) return undefined
        if (choice.other) {
          const otherText = (
            answers[`${step.id}Other`] as string | undefined
          )?.trim()
          return otherText || choice.label
        }
        return choice.label
      })
      .filter((label): label is string => Boolean(label))

    return labels.length > 0
      ? [{ label: step.summaryLabel, value: labels.join(', ') }]
      : []
  })
}

function OnboardingDone() {
  const navigate = useNavigate()
  const location = useLocation()
  const answers =
    (location.state as { answers?: OnboardingAnswers } | null)?.answers ?? {}

  const summaryRows = buildSummaryRows(answers)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      <img
        src={ellipseTop}
        alt=""
        className="pointer-events-none absolute -top-30 -left-30 h-80 w-80"
      />
      <img
        src={ellipseBottom}
        alt=""
        className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60"
      />

      <div className="relative flex min-h-screen w-full flex-col items-center">
        <OnboardingTopbar />

        <div className="flex w-full max-w-150 flex-1 flex-col items-center justify-center gap-7 px-6 py-10 text-center">
          <CheckCircle2
            className="h-25 w-25 text-[#519b5c]"
            strokeWidth={1.5}
          />

          <div className="font-thai flex flex-col gap-2">
            <p className="text-amalfidark flex items-center justify-center gap-2 text-3xl font-bold">
              ยินดีต้อนรับสู่ ClickDee!
              <PartyPopper className="text-citrus h-8 w-8" />
            </p>
            <p className="text-base leading-relaxed text-[#8e98a8]">
              เราปรับแต่งระบบให้เหมาะกับธุรกิจของคุณแล้ว พร้อมให้ AI
              เริ่มดูแลโฆษณาได้ทันที
            </p>
          </div>

          <div className="border-amalfilight-hover font-thai flex w-full flex-col gap-4 rounded-2xl border-[1.5px] bg-white px-7 py-6 text-left">
            <p className="text-amalfidark text-sm font-semibold">
              สรุปสิ่งที่เราตั้งค่าให้คุณแล้ว
            </p>
            {summaryRows.length > 0 ? (
              summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="bg-amalfilight text-amalfi flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                    ✓
                  </span>
                  <span className="shrink-0 text-[#8e98a8]">{row.label}</span>
                  <span className="bg-amalfilight-hover h-px flex-1" />
                  <span className="text-amalfidark text-right font-medium">
                    {row.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#8e98a8]">
                ยังไม่มีข้อมูลจากแบบสอบถาม
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/home')}
            className="bg-citrus hover:bg-citrushover text-amalfi font-thai flex h-14 w-80 items-center justify-center gap-2 rounded-2xl text-lg font-bold transition-all hover:scale-105 hover:cursor-pointer"
          >
            เข้าสู่แดชบอร์ด
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingDone
