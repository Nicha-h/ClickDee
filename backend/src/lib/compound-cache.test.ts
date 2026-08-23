import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getCachedResearch,
  setCachedResearch,
  __resetCompoundCacheForTests,
} from './compound-cache.js'

beforeEach(() => {
  __resetCompoundCacheForTests()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('compound-cache', () => {
  it('returns undefined for a key that was never set', () => {
    expect(getCachedResearch('missing')).toBeUndefined()
  })

  it('returns the cached value within the TTL window', () => {
    setCachedResearch('key', 'findings', 10_000)
    expect(getCachedResearch('key')).toBe('findings')
  })

  it('returns undefined once the TTL has expired', () => {
    vi.useFakeTimers()
    setCachedResearch('key', 'findings', 1_000)

    vi.advanceTimersByTime(1_001)

    expect(getCachedResearch('key')).toBeUndefined()
  })

  it('clears all entries on reset', () => {
    setCachedResearch('key', 'findings', 10_000)
    __resetCompoundCacheForTests()
    expect(getCachedResearch('key')).toBeUndefined()
  })
})
