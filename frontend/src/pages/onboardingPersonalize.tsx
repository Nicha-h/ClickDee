import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingTopbar from '@/components/onboardingTopbar'
import OnboardingWizard, {
  type OnboardingAnswers,
} from '@/components/onboardingWizard'
import { AI_FOLLOWUP_STEPS } from '@/data/onboarding'

function OnboardingPersonalize() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialAnswers = (
    location.state as { answers?: OnboardingAnswers } | null
  )?.answers

  const handleComplete = (answers: OnboardingAnswers) => {
    navigate('/onboarding/done', { state: { answers } })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <OnboardingTopbar />
      <div className="flex flex-1 justify-center px-10 py-10">
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
