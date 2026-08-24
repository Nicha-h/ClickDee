import { createContext, useContext, useState, type ReactNode } from 'react'
import { getTier, type TierConfig, type TierKey } from '@/data/tiers'

interface UsageState {
  adsCreated: number
  consultantQuestions: number
  aiImageCreation: number
  aiVideoCreation: number
  activeCampaigns: number
  optimizationChecksThisWeek: number
}

interface SubscriptionContextValue {
  tier: TierKey
  setTier: (tier: TierKey) => void
  usage: UsageState
  tierConfig: TierConfig
}

const MOCK_USAGE: UsageState = {
  adsCreated: 9,
  consultantQuestions: 62,
  aiImageCreation: 18,
  aiVideoCreation: 6,
  activeCampaigns: 4,
  optimizationChecksThisWeek: 47,
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Demo default: this repo has no separate demo-vs-signup account distinction
  // yet, so 'pro' is the app-wide default rather than something scoped to a
  // specific demo user.
  const [tier, setTier] = useState<TierKey>('pro')

  // Usage is intentionally static and does not reclamp when the tier changes —
  // switching tiers in Settings against these same numbers is what makes the
  // at-limit/over-quota state demonstrable.
  const usage = MOCK_USAGE

  return (
    <SubscriptionContext.Provider
      value={{ tier, setTier, usage, tierConfig: getTier(tier) }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx)
    throw new Error('useSubscription must be used within SubscriptionProvider')
  return ctx
}
