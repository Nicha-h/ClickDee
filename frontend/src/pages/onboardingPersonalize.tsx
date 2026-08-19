import { useLocation, useNavigate } from 'react-router-dom'
import OnboardingTopbar from '@/components/onboardingTopbar'
import type { OnboardingAnswers } from '@/components/onboardingWizard'
import OnboardingAiFollowup, {
  type FollowupQa,
  type FollowupQuestion,
} from '@/components/onboardingAiFollowup'
import type { FollowupQuestionRequestBusinessProfile } from '@/api/generated/client'

type PersonalizeState = {
  answers?: OnboardingAnswers
  email?: string
  password?: string
  businessProfile?: FollowupQuestionRequestBusinessProfile
  firstQuestion?: FollowupQuestion | null
}

function OnboardingPersonalize() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    answers,
    email,
    password,
    businessProfile,
    firstQuestion = null,
  } = (location.state as PersonalizeState | null) ?? {}

  const handleComplete = (aiMemory: FollowupQa[], aiMemoryConsent: boolean) => {
    navigate('/onboarding/done', {
      state: { answers, email, password, aiMemory, aiMemoryConsent },
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <OnboardingTopbar />
      <div className="flex flex-1 justify-center px-4 py-10 md:px-8 lg:px-10">
        <OnboardingAiFollowup
          businessProfile={businessProfile ?? {}}
          initialQuestion={firstQuestion}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}

export default OnboardingPersonalize
