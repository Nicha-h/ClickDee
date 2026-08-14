import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingTopbar from '@/components/onboardingTopbar'
import OnboardingWizard, {
  type OnboardingAnswers,
} from '@/components/onboardingWizard'
import { ONBOARDING_STEPS } from '@/data/onboarding'

type SignupState = { email?: string; password?: string }

function Onboarding() {
  const navigate = useNavigate()
  const location = useLocation()
  const { email, password } = (location.state as SignupState | null) ?? {}

  const handleComplete = (answers: OnboardingAnswers) => {
    navigate('/onboarding/processing', { state: { answers, email, password } })
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
