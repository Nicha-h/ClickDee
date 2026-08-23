import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCachedRecommendations,
  setCachedRecommendations,
  __resetRecommendationCacheForTests,
} from './recommendation-cache.js'
import type { RecommendationItem } from '../services/recommendation-ai.service.js'

const ITEM: RecommendationItem = {
  campaignId: 'campaign-1',
  title: 'แคมเปญใกล้หมดเวลา',
  description: 'แคมเปญนี้จะสิ้นสุดเร็วๆ นี้ ลองพิจารณาขยายเวลา',
  actionLabel: 'ดูแคมเปญ',
}

beforeEach(() => {
  __resetRecommendationCacheForTests()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('recommendation-cache', () => {
  it('returns undefined for a key that was never set', () => {
    expect(getCachedRecommendations('missing')).toBeUndefined()
  })

  it('returns the cached value within the TTL window', () => {
    setCachedRecommendations('key', [ITEM], 10_000)
    expect(getCachedRecommendations('key')).toEqual([ITEM])
  })

  it('returns undefined once the TTL has expired', () => {
    vi.useFakeTimers()
    setCachedRecommendations('key', [ITEM], 1_000)

    vi.advanceTimersByTime(1_001)

    expect(getCachedRecommendations('key')).toBeUndefined()
  })

  it('clears all entries on reset', () => {
    setCachedRecommendations('key', [ITEM], 10_000)
    __resetRecommendationCacheForTests()
    expect(getCachedRecommendations('key')).toBeUndefined()
  })
})
