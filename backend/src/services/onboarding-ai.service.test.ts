import { describe, expect, it, vi, beforeEach } from 'vitest'

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}))

vi.mock('../lib/openai.js', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/openai.js')>('../lib/openai.js')
  return {
    ...actual,
    getOpenAiClient: () => ({
      chat: { completions: { create: createMock } },
    }),
  }
})

import {
  generateFollowupQuestion,
  MAX_FOLLOWUP_QUESTIONS,
} from './onboarding-ai.service.js'
import { AiNotConfiguredError } from '../lib/openai.js'

beforeEach(() => {
  createMock.mockReset()
})

describe('generateFollowupQuestion', () => {
  it('stops without calling the AI once the question cap is reached', async () => {
    const previousAnswers = Array.from(
      { length: MAX_FOLLOWUP_QUESTIONS },
      (_, i) => ({ question: `Q${i}`, answer: `A${i}` }),
    )
    const result = await generateFollowupQuestion({}, previousAnswers)
    expect(result).toEqual({ done: true, question: null })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns the parsed question when the AI responds with valid JSON', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              done: false,
              question: 'ลูกค้าหลักของคุณคือใคร?',
            }),
          },
        },
      ],
    })
    const result = await generateFollowupQuestion(
      { businessName: 'ร้านกาแฟ' },
      [],
    )
    expect(result).toEqual({
      done: false,
      question: 'ลูกค้าหลักของคุณคือใคร?',
    })
  })

  it('fails safe to done:true when the AI returns malformed JSON', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json' } }],
    })
    const result = await generateFollowupQuestion({}, [])
    expect(result).toEqual({ done: true, question: null })
  })

  it('fails safe to done:true when the AI response fails schema validation', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ foo: 'bar' }) } }],
    })
    const result = await generateFollowupQuestion({}, [])
    expect(result).toEqual({ done: true, question: null })
  })

  it('rethrows AiNotConfiguredError instead of failing safe', async () => {
    createMock.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    await expect(generateFollowupQuestion({}, [])).rejects.toBeInstanceOf(
      AiNotConfiguredError,
    )
  })
})
