import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createMock, getGroqClientMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  getGroqClientMock: vi.fn(),
}))
vi.mock('./openai.js', () => ({
  getGroqClient: getGroqClientMock,
}))

const { distillCaptionRequestMock } = vi.hoisted(() => ({
  distillCaptionRequestMock: vi.fn(),
}))
vi.mock('./distiller.js', () => ({
  distillCaptionRequest: distillCaptionRequestMock,
}))

const { getCachedResearchMock, setCachedResearchMock } = vi.hoisted(() => ({
  getCachedResearchMock: vi.fn(),
  setCachedResearchMock: vi.fn(),
}))
vi.mock('./compound-cache.js', () => ({
  getCachedResearch: getCachedResearchMock,
  setCachedResearch: setCachedResearchMock,
}))

import { researchForCaption } from './compound.js'
import { env } from '../config/env.js'

const DISTILLED = {
  cacheKey: 'abc123',
  researchQuery: 'coffee shop rainy season promo',
  tags: ['weather'],
}

let originalGroqKey: string | undefined

beforeEach(() => {
  createMock.mockReset()
  getGroqClientMock.mockReset().mockReturnValue({
    chat: { completions: { create: createMock } },
  })
  distillCaptionRequestMock.mockReset().mockResolvedValue(DISTILLED)
  getCachedResearchMock.mockReset().mockReturnValue(undefined)
  setCachedResearchMock.mockReset()
  originalGroqKey = env.GROQ_API_KEY
  env.GROQ_API_KEY = 'test-groq-key'
})

afterEach(() => {
  env.GROQ_API_KEY = originalGroqKey
})

describe('researchForCaption', () => {
  it('returns null without calling anything when GROQ_API_KEY is unset', async () => {
    env.GROQ_API_KEY = undefined

    const result = await researchForCaption({ caption: 'x' })

    expect(result).toBeNull()
    expect(distillCaptionRequestMock).not.toHaveBeenCalled()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns null when distillation fails, without calling Compound', async () => {
    distillCaptionRequestMock.mockResolvedValueOnce(null)

    const result = await researchForCaption({ caption: 'x' })

    expect(result).toBeNull()
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns the cached value on a cache hit, skipping the raw call entirely', async () => {
    getCachedResearchMock.mockReturnValueOnce('cached findings')

    const result = await researchForCaption({ caption: 'x' })

    expect(result).toBe('cached findings')
    expect(createMock).not.toHaveBeenCalled()
  })

  it('calls Compound on a cache miss and stores the result with the weather TTL', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'fresh findings' } }],
    })

    const result = await researchForCaption({ caption: 'x' })

    expect(result).toBe('fresh findings')
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: env.GROQ_COMPOUND_MODEL }),
    )
    expect(setCachedResearchMock).toHaveBeenCalledWith(
      'abc123',
      'fresh findings',
      env.COMPOUND_CACHE_WEATHER_TTL_SECONDS * 1000,
    )
  })

  it('uses the default TTL when the distilled request has no weather tag', async () => {
    distillCaptionRequestMock.mockResolvedValueOnce({
      ...DISTILLED,
      tags: ['trend'],
    })
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'fresh findings' } }],
    })

    await researchForCaption({ caption: 'x' })

    expect(setCachedResearchMock).toHaveBeenCalledWith(
      'abc123',
      'fresh findings',
      env.COMPOUND_CACHE_DEFAULT_TTL_SECONDS * 1000,
    )
  })

  it('returns null and does not cache anything when Compound throws', async () => {
    createMock.mockImplementationOnce(() => {
      throw new Error('boom')
    })

    const result = await researchForCaption({ caption: 'x' })

    expect(result).toBeNull()
    expect(setCachedResearchMock).not.toHaveBeenCalled()
  })
})
