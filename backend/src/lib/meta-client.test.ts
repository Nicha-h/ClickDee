import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  metaRequest,
  metaRequestWithRetry,
  MetaApiError,
  MetaTokenExpiredError,
  MetaRateLimitError,
  MetaInvalidParameterError,
  MetaPolicyViolationError,
} from './meta-client.js'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function metaError(code: number, extra: Record<string, unknown> = {}) {
  return { error: { message: 'Meta error', code, ...extra } }
}

describe('meta-client error mapping', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps code 190 to MetaTokenExpiredError', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, metaError(190)))
    await expect(
      metaRequest('act_1/campaigns', { accessToken: 'tok' }),
    ).rejects.toBeInstanceOf(MetaTokenExpiredError)
  })

  it('maps code 17 to MetaRateLimitError', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, metaError(17)))
    await expect(
      metaRequest('act_1/campaigns', { accessToken: 'tok' }),
    ).rejects.toBeInstanceOf(MetaRateLimitError)
  })

  it('maps code 100 to MetaInvalidParameterError and preserves the user-facing message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        400,
        metaError(100, {
          error_user_title: 'Invalid objective',
          error_user_msg: 'Please choose a valid campaign objective.',
        }),
      ),
    )
    try {
      await metaRequest('act_1/campaigns', { accessToken: 'tok' })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(MetaInvalidParameterError)
      expect((err as MetaInvalidParameterError).errorUserMsg).toBe(
        'Please choose a valid campaign objective.',
      )
    }
  })

  it('maps code 2635 to MetaPolicyViolationError', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, metaError(2635)))
    await expect(
      metaRequest('act_1/adcreatives', { accessToken: 'tok', method: 'POST' }),
    ).rejects.toBeInstanceOf(MetaPolicyViolationError)
  })

  it('falls back to the generic MetaApiError for unmapped codes', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, metaError(9999)))
    await expect(
      metaRequest('act_1/campaigns', { accessToken: 'tok' }),
    ).rejects.toBeInstanceOf(MetaApiError)
  })

  it('resolves with parsed JSON on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: '123' }))
    const result = await metaRequest<{ id: string }>('act_1/campaigns', {
      accessToken: 'tok',
    })
    expect(result).toEqual({ id: '123' })
  })
})

describe('metaRequestWithRetry', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('retries on MetaRateLimitError with backoff and eventually succeeds', async () => {
    let attempt = 0
    const fn = vi.fn(async () => {
      attempt++
      if (attempt < 3) {
        throw new MetaRateLimitError({ message: 'rate limited', code: 17 }, 400)
      }
      return 'ok'
    })

    const promise = metaRequestWithRetry(fn, 5)
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('does not retry non-rate-limit errors', async () => {
    const fn = vi.fn(async () => {
      throw new MetaInvalidParameterError(
        { message: 'bad param', code: 100 },
        400,
      )
    })
    await expect(metaRequestWithRetry(fn, 5)).rejects.toBeInstanceOf(
      MetaInvalidParameterError,
    )
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('gives up after maxRetries and rethrows the rate limit error', async () => {
    const fn = vi.fn(async () => {
      throw new MetaRateLimitError({ message: 'rate limited', code: 17 }, 400)
    })
    const promise = metaRequestWithRetry(fn, 2)
    const assertion = expect(promise).rejects.toBeInstanceOf(MetaRateLimitError)
    await vi.runAllTimersAsync()
    await assertion
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
