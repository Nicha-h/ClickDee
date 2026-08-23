import { env } from '../config/env.js'

// Guard for opt-in live (non-mocked) AI tests — see vitest.live.config.ts.
// No live test file exists yet in this repo; this exists so one can be
// added later without needing to invent budget-tracking from scratch, and
// so it's hard to accidentally add an unguarded live test that eats a whole
// day's Compound quota (250 RPD free tier) via a retry-storm bug.
export class LiveCallBudgetExceededError extends Error {}

let liveCallCount = 0
let liveCompoundCallCount = 0

export function recordLiveCall({
  provider,
  model,
}: {
  provider: string
  model: string
}): void {
  console.debug('[live-ai]', provider, model, new Date().toISOString())

  liveCallCount++
  if (liveCallCount > env.MAX_LIVE_CALLS_PER_RUN) {
    throw new LiveCallBudgetExceededError(
      `live-call cap (${env.MAX_LIVE_CALLS_PER_RUN}) hit for this test run`,
    )
  }

  if (provider === 'groq' && model === env.GROQ_COMPOUND_MODEL) {
    liveCompoundCallCount++
    if (liveCompoundCallCount > env.MAX_LIVE_COMPOUND_CALLS_PER_RUN) {
      throw new LiveCallBudgetExceededError(
        `Compound live-call cap (${env.MAX_LIVE_COMPOUND_CALLS_PER_RUN}) hit for this test run`,
      )
    }
  }
}

export function __resetLiveCallGuardForTests(): void {
  liveCallCount = 0
  liveCompoundCallCount = 0
}
