import type { Context } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getConnInfo } from '@hono/node-server/conninfo'
import { env } from '../config/env.js'

// Client identity for per-IP limiting. X-Forwarded-For is never read: the
// client controls its leftmost entries, so keying on it lets anyone reset
// their limit per request. X-Real-IP is only trusted behind our own proxy
// (docker/nginx.conf overwrites it with $remote_addr), opted into via
// TRUST_PROXY; otherwise the socket address is used.
export function clientIp(c: Context, trustProxy = env.TRUST_PROXY): string {
  if (trustProxy) {
    const realIp = c.req.header('x-real-ip')
    if (realIp) return realIp
  }
  try {
    return getConnInfo(c).remote.address ?? 'unknown'
  } catch {
    // No Node socket (e.g. app.request() in tests).
    return 'unknown'
  }
}

// Single-instance, in-memory sliding-window limiter. Good enough to bound
// cost/abuse on an unauthenticated AI-calling endpoint; move to a shared
// store (e.g. Redis) if the app ever scales to multiple instances. Pass a
// constant `key` to make it a global cap across all clients.
export function rateLimit({
  windowMs,
  max,
  key = (c) => clientIp(c),
}: {
  windowMs: number
  max: number
  key?: (c: Context) => string
}) {
  const hits = new Map<string, number[]>()

  // Drop keys whose hits have all aged out, so one-off clients don't
  // accumulate in memory forever.
  const sweep = setInterval(
    () => {
      const windowStart = Date.now() - windowMs
      for (const [k, timestamps] of hits) {
        if (timestamps.every((t) => t <= windowStart)) hits.delete(k)
      }
    },
    Math.min(windowMs, 60_000),
  )
  sweep.unref()

  return createMiddleware(async (c, next) => {
    const k = key(c)
    const now = Date.now()
    const windowStart = now - windowMs
    const timestamps = (hits.get(k) ?? []).filter((t) => t > windowStart)

    if (timestamps.length >= max) {
      hits.set(k, timestamps)
      throw new HTTPException(429, { message: 'Too many requests' })
    }

    timestamps.push(now)
    hits.set(k, timestamps)
    await next()
  })
}
