import { afterEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { clientIp, rateLimit } from './rate-limit.js'

function appWith(limiter: ReturnType<typeof rateLimit>) {
  return new Hono().get('/', limiter, (c) => c.text('ok'))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('rateLimit', () => {
  it('ignores spoofed X-Forwarded-For values', async () => {
    const app = appWith(rateLimit({ windowMs: 60_000, max: 2 }))
    const statuses: number[] = []
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/', {
        headers: { 'X-Forwarded-For': `10.0.0.${i}` },
      })
      statuses.push(res.status)
    }
    expect(statuses).toEqual([200, 200, 429])
  })

  it('applies a constant key as a global cap across clients', async () => {
    const app = appWith(
      rateLimit({ windowMs: 60_000, max: 1, key: () => 'global' }),
    )
    expect((await app.request('/')).status).toBe(200)
    expect((await app.request('/')).status).toBe(429)
  })

  it('frees a key once its window has passed', async () => {
    vi.useFakeTimers()
    const app = appWith(rateLimit({ windowMs: 1_000, max: 1 }))
    expect((await app.request('/')).status).toBe(200)
    expect((await app.request('/')).status).toBe(429)
    vi.advanceTimersByTime(1_001)
    expect((await app.request('/')).status).toBe(200)
  })
})

describe('clientIp', () => {
  const ipOf = async (trustProxy: boolean, headers: Record<string, string>) => {
    const app = new Hono().get('/', (c) => c.text(clientIp(c, trustProxy)))
    return (await app.request('/', { headers })).text()
  }

  it('trusts X-Real-IP only behind a trusted proxy', async () => {
    expect(await ipOf(true, { 'X-Real-IP': '1.2.3.4' })).toBe('1.2.3.4')
    expect(await ipOf(false, { 'X-Real-IP': '1.2.3.4' })).toBe('unknown')
  })

  it('never reads X-Forwarded-For', async () => {
    expect(await ipOf(true, { 'X-Forwarded-For': '1.2.3.4' })).toBe('unknown')
  })
})
