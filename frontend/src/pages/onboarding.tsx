import { useNavigate } from 'react-router-dom'
import OnboardingTopbar from '@/components/onboardingTopbar'
import OnboardingWizard, {
  type OnboardingAnswers,
} from '@/components/onboardingWizard'
import { ONBOARDING_STEPS } from '@/data/onboarding'

function Onboarding() {
  const navigate = useNavigate()

  const handleComplete = (answers: OnboardingAnswers) => {
    navigate('/onboarding/processing', { state: { answers } })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <OnboardingTopbar />
      <div className="flex flex-1 justify-center px-4 py-10 md:px-8 lg:px-10">
        <OnboardingWizard
          steps={ONBOARDING_STEPS}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}

export default Onboarding
