import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// lib/openai.ts constructs its own OpenAI client instances internally
// (createChatCompletion -> getClientForProvider -> `new OpenAI(...)`), so
// mocking createChatCompletion's own module (self-reference) wouldn't
// intercept those internal calls — vi.mock only replaces bindings as seen
// by *other* importers, not calls a module makes to its own other exports.
// Mocking the genuinely-external `openai` package instead sidesteps that:
// subclassing the real default export preserves its static error classes
// (RateLimitError etc.) via the prototype chain, so both this test file's
// constructed errors and the production `instanceof` checks resolve to the
// same real class.
const { createMock, constructedConfigs } = vi.hoisted(() => ({
  createMock: vi.fn(),
  constructedConfigs: [] as Record<string, unknown>[],
}))

vi.mock('openai', async () => {
  const actual = await vi.importActual<typeof import('openai')>('openai')
  class MockOpenAI extends actual.default {
    constructor(config: Record<string, unknown>) {
      super(config)
      constructedConfigs.push(config)
    }
    // Class field — runs after super(), overriding whatever the real
    // constructor set up. Every provider's client shares this same mock;
    // each CHAIN entry has a unique model id, which is enough to tell calls
    // apart without needing distinct client instances.
    chat = { completions: { create: createMock } }
  }
  return { ...actual, default: MockOpenAI }
})

import { RateLimitError } from 'openai'
import {
  createChatCompletion,
  __resetCascadeStateForTests,
  AiNotConfiguredError,
  AllTiersExhaustedError,
} from './openai.js'
import { env } from '../config/env.js'

const MESSAGES = { messages: [{ role: 'user' as const, content: 'hi' }] }

function rateLimitError(retryAfterSeconds?: number) {
  const headers = new Headers()
  if (retryAfterSeconds !== undefined) {
    headers.set('retry-after', String(retryAfterSeconds))
  }
  return new RateLimitError(
    429,
    { message: 'rate limited' },
    'rate limited',
    headers,
  )
}

let originalGeminiKey: string | undefined
let originalGroqKey: string | undefined

beforeEach(() => {
  createMock.mockReset()
  constructedConfigs.length = 0
  __resetCascadeStateForTests()
  originalGeminiKey = env.GEMINI_API_KEY
  originalGroqKey = env.GROQ_API_KEY
  env.GEMINI_API_KEY = 'test-gemini-key'
  env.GROQ_API_KEY = 'test-groq-key'
})

afterEach(() => {
  env.GEMINI_API_KEY = originalGeminiKey
  env.GROQ_API_KEY = originalGroqKey
  vi.useRealTimers()
})

describe('createChatCompletion', () => {
  it('uses the top tier on success', async () => {
    createMock.mockResolvedValueOnce({ id: 'ok' })

    const result = await createChatCompletion(MESSAGES)

    expect(result).toEqual({ id: 'ok' })
    expect(createMock).toHaveBeenCalledTimes(1)
    expect(createMock.mock.calls[0][0]).toMatchObject({
      model: 'gemini-3.7-flash',
    })
  })

  it('cascades to the next tier when the current one is rate-limited', async () => {
    createMock
      .mockImplementationOnce(() => {
        throw rateLimitError()
      })
      .mockResolvedValueOnce({ id: 'ok' })

    const result = await createChatCompletion(MESSAGES)

    expect(result).toEqual({ id: 'ok' })
    expect(createMock).toHaveBeenCalledTimes(2)
    expect(createMock.mock.calls[0][0]).toMatchObject({
      model: 'gemini-3.7-flash',
    })
    expect(createMock.mock.calls[1][0]).toMatchObject({
      model: 'gemini-3.6-flash',
    })
  })

  it('cascades across providers once every Gemini tier is rate-limited', async () => {
    createMock
      .mockImplementationOnce(() => {
        throw rateLimitError()
      })
      .mockImplementationOnce(() => {
        throw rateLimitError()
      })
      .mockImplementationOnce(() => {
        throw rateLimitError()
      })
      .mockResolvedValueOnce({ id: 'groq-ok' })

    const result = await createChatCompletion(MESSAGES)

    expect(result).toEqual({ id: 'groq-ok' })
    expect(createMock).toHaveBeenCalledTimes(4)
    expect(createMock.mock.calls[3][0]).toMatchObject({
      model: 'openai/gpt-oss-20b',
    })
    // Confirms this genuinely switched provider/client, not just model id.
    const geminiConfig = constructedConfigs.find((c) =>
      String(c.baseURL).includes('generativelanguage.googleapis.com'),
    )
    const groqConfig = constructedConfigs.find((c) =>
      String(c.baseURL).includes('api.groq.com'),
    )
    expect(geminiConfig).toBeDefined()
    expect(groqConfig).toBeDefined()
  })

  it('starts the next request from the last-successful tier, not the top', async () => {
    createMock
      .mockImplementationOnce(() => {
        throw rateLimitError()
      })
      .mockResolvedValueOnce({ id: 'first' })
    await createChatCompletion(MESSAGES)
    expect(createMock).toHaveBeenCalledTimes(2)

    createMock.mockResolvedValueOnce({ id: 'second' })
    const result = await createChatCompletion(MESSAGES)

    expect(result).toEqual({ id: 'second' })
    expect(createMock).toHaveBeenCalledTimes(3)
    // Straight to tier 1 (gemini-3.6-flash) — tier 0 is not retried.
    expect(createMock.mock.calls[2][0]).toMatchObject({
      model: 'gemini-3.6-flash',
    })
  })

  it('promotes back to the top tier once its cooldown has passed', async () => {
    vi.useFakeTimers()

    createMock
      .mockImplementationOnce(() => {
        throw rateLimitError(1)
      })
      .mockResolvedValueOnce({ id: 'first' })
    await createChatCompletion(MESSAGES)
    expect(createMock.mock.calls[1][0]).toMatchObject({
      model: 'gemini-3.6-flash',
    })

    vi.advanceTimersByTime(1_100)

    createMock.mockResolvedValueOnce({ id: 'second' })
    await createChatCompletion(MESSAGES)
    expect(createMock.mock.calls[2][0]).toMatchObject({
      model: 'gemini-3.7-flash',
    })
  })

  it('does not cascade on a content-filtered response — returns it as-is', async () => {
    const filtered = {
      choices: [{ finish_reason: 'content_filter', message: { content: null } }],
    }
    createMock.mockResolvedValueOnce(filtered)

    const result = await createChatCompletion(MESSAGES)

    expect(result).toEqual(filtered)
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('does not cascade on a non-rate-limit error — rethrows immediately', async () => {
    const boom = new Error('boom')
    createMock.mockImplementationOnce(() => {
      throw boom
    })

    await expect(createChatCompletion(MESSAGES)).rejects.toBe(boom)
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('throws AllTiersExhaustedError once every tier is rate-limited, without looping twice', async () => {
    createMock.mockImplementation(() => {
      throw rateLimitError()
    })

    await expect(createChatCompletion(MESSAGES)).rejects.toBeInstanceOf(
      AllTiersExhaustedError,
    )
    expect(createMock).toHaveBeenCalledTimes(6)
  })

  it('throws AiNotConfiguredError when neither provider is configured', async () => {
    env.GEMINI_API_KEY = undefined
    env.GROQ_API_KEY = undefined

    await expect(createChatCompletion(MESSAGES)).rejects.toBeInstanceOf(
      AiNotConfiguredError,
    )
    expect(createMock).not.toHaveBeenCalled()
  })

  it('skips a provider with no configured key instead of erroring', async () => {
    env.GROQ_API_KEY = undefined
    createMock.mockImplementation(() => {
      throw rateLimitError()
    })

    // Only the 3 Gemini tiers should ever be attempted; the 3 Groq tiers are
    // skipped as permanently unavailable, so the chain exhausts at 3 calls.
    await expect(createChatCompletion(MESSAGES)).rejects.toBeInstanceOf(
      AllTiersExhaustedError,
    )
    expect(createMock).toHaveBeenCalledTimes(3)
  })

  it('builds provider clients with maxRetries: 0 so the cascade owns retry behavior', async () => {
    createMock.mockResolvedValueOnce({ id: 'ok' })
    await createChatCompletion(MESSAGES)
    expect(constructedConfigs[0]).toMatchObject({ maxRetries: 0 })
  })
})
