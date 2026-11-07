import { describe, expect, it } from 'vitest'
import { app } from './app.js'

describe('security headers', () => {
  it('sets a locked-down CSP and strips X-Powered-By on /api/*', async () => {
    const res = await app.request('/api/health')
    expect(res.headers.get('content-security-policy')).toContain(
      "default-src 'none'",
    )
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('strict-transport-security')).toBeTruthy()
    expect(res.headers.get('x-powered-by')).toBeNull()
  })
})

describe('CORS', () => {
  it('allows the configured origin', async () => {
    const res = await app.request('/api/health', {
      headers: { Origin: 'http://localhost:5173' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:5173',
    )
  })

  it('does not allow other origins', async () => {
    const res = await app.request('/api/health', {
      headers: { Origin: 'https://evil.example' },
    })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
