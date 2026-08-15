import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getConnInfo } from '@hono/node-server/conninfo'

// Single-instance, in-memory sliding-window limiter. Good enough to bound
// cost/abuse on an unauthenticated AI-calling endpoint; move to a shared
// store (e.g. Redis) if the app ever scales to multiple instances.
export function rateLimit({
  windowMs,
  max,
}: {
  windowMs: number
  max: number
}) {
  const hits = new Map<string, number[]>()

  return createMiddleware(async (c, next) => {
    const key =
      c.req.header('x-forwarded-for') ?? getConnInfo(c).remote.address ?? ''
    const now = Date.now()
    const windowStart = now - windowMs
    const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart)

    if (timestamps.length >= max) {
      throw new HTTPException(429, { message: 'Too many requests' })
    }

    timestamps.push(now)
    hits.set(key, timestamps)
    await next()
  })
}
