import type { RecommendationItem } from '../services/recommendation-ai.service.js'

// Single-instance, in-memory TTL cache for AI-generated campaign
// recommendations, keyed by a content fingerprint of the caller's campaigns
// (see buildCacheKey in recommendation-ai.service.ts). A cache hit skips
// calling the AI cascade entirely. Same convention as lib/compound-cache.ts:
// fine for a single process, move to a shared store (e.g. Redis) if the app
// ever scales to multiple instances.
const cache = new Map<
  string,
  { value: RecommendationItem[]; expiresAt: number }
>()

export function getCachedRecommendations(
  key: string,
): RecommendationItem[] | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

export function setCachedRecommendations(
  key: string,
  value: RecommendationItem[],
  ttlMs: number,
): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function __resetRecommendationCacheForTests(): void {
  cache.clear()
}
