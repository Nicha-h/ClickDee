// Single-instance, in-memory TTL cache for Compound research results, keyed
// by the Distiller's normalized cacheKey (see lib/distiller.ts). Skips
// calling Compound entirely on a hit — this is the main defense against
// burning Compound's tight free-tier quota, not prompt trimming alone. Same
// convention as middleware/rate-limit.ts: fine for a single process, move to
// a shared store (e.g. Redis) if the app ever scales to multiple instances.
const cache = new Map<string, { value: string; expiresAt: number }>()

export function getCachedResearch(key: string): string | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() >= entry.expiresAt) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

export function setCachedResearch(
  key: string,
  value: string,
  ttlMs: number,
): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function __resetCompoundCacheForTests(): void {
  cache.clear()
}
