import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingTopbar from '@/components/onboardingTopbar'
import OnboardingWizard, {
  type OnboardingAnswers,
} from '@/components/onboardingWizard'
import { AI_FOLLOWUP_STEPS } from '@/data/onboarding'

type PersonalizeState = {
  answers?: OnboardingAnswers
  email?: string
  password?: string
}

function OnboardingPersonalize() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    answers: initialAnswers,
    email,
    password,
  } = (location.state as PersonalizeState | null) ?? {}

  const handleComplete = (answers: OnboardingAnswers) => {
    navigate('/onboarding/done', { state: { answers, email, password } })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <OnboardingTopbar />
      <div className="flex flex-1 justify-center px-4 py-10 md:px-8 lg:px-10">
        <OnboardingWizard
          steps={AI_FOLLOWUP_STEPS}
          initialAnswers={initialAnswers}
          aiLabeled
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}

export default OnboardingPersonalize
