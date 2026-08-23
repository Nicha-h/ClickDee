import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  recordLiveCall,
  __resetLiveCallGuardForTests,
  LiveCallBudgetExceededError,
} from './ai-live-test-guard.js'
import { env } from '../config/env.js'

let originalMax: number
let originalMaxCompound: number
let debugSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  __resetLiveCallGuardForTests()
  originalMax = env.MAX_LIVE_CALLS_PER_RUN
  originalMaxCompound = env.MAX_LIVE_COMPOUND_CALLS_PER_RUN
  env.MAX_LIVE_CALLS_PER_RUN = 2
  env.MAX_LIVE_COMPOUND_CALLS_PER_RUN = 1
  debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  env.MAX_LIVE_CALLS_PER_RUN = originalMax
  env.MAX_LIVE_COMPOUND_CALLS_PER_RUN = originalMaxCompound
  debugSpy.mockRestore()
})

describe('recordLiveCall', () => {
  it('logs each call once', () => {
    recordLiveCall({ provider: 'gemini', model: 'gemini-3.7-flash' })
    expect(debugSpy).toHaveBeenCalledTimes(1)
  })

  it('allows calls up to the per-run cap', () => {
    expect(() =>
      recordLiveCall({ provider: 'gemini', model: 'gemini-3.7-flash' }),
    ).not.toThrow()
    expect(() =>
      recordLiveCall({ provider: 'gemini', model: 'gemini-3.6-flash' }),
    ).not.toThrow()
  })

  it('throws LiveCallBudgetExceededError past the per-run cap', () => {
    recordLiveCall({ provider: 'gemini', model: 'gemini-3.7-flash' })
    recordLiveCall({ provider: 'gemini', model: 'gemini-3.6-flash' })

    expect(() =>
      recordLiveCall({ provider: 'gemini', model: 'gemini-3.5-flash' }),
    ).toThrow(LiveCallBudgetExceededError)
  })

  it('throws LiveCallBudgetExceededError past the Compound-specific cap', () => {
    recordLiveCall({ provider: 'groq', model: env.GROQ_COMPOUND_MODEL })

    expect(() =>
      recordLiveCall({ provider: 'groq', model: env.GROQ_COMPOUND_MODEL }),
    ).toThrow(LiveCallBudgetExceededError)
  })

  it('resets counters between runs', () => {
    recordLiveCall({ provider: 'gemini', model: 'gemini-3.7-flash' })
    recordLiveCall({ provider: 'gemini', model: 'gemini-3.6-flash' })
    __resetLiveCallGuardForTests()

    expect(() =>
      recordLiveCall({ provider: 'gemini', model: 'gemini-3.7-flash' }),
    ).not.toThrow()
  })
})
