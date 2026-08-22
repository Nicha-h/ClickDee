import { describe, expect, it, vi, beforeEach } from 'vitest'

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}))

vi.mock('../lib/openai.js', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/openai.js')>('../lib/openai.js')
  return {
    ...actual,
    createChatCompletion: createMock,
  }
})

import { generateFollowupQuestion } from './onboarding-ai.service.js'
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AllTiersExhaustedError,
} from '../lib/openai.js'
import { env } from '../config/env.js'

beforeEach(() => {
  createMock.mockReset()
})

function jsonMessage(content: unknown) {
  return { choices: [{ message: { content: JSON.stringify(content) } }] }
}

const DONE_RESULT = {
  done: true,
  question: null,
  type: 'text',
  choices: null,
}

describe('generateFollowupQuestion', () => {
  it('stops without calling the AI once the question cap is reached', async () => {
    const previousAnswers = Array.from(
      { length: env.MAX_FOLLOWUP_QUESTIONS },
      (_, i) => ({ question: `Q${i}`, answer: `A${i}` }),
    )
    const result = await generateFollowupQuestion({}, previousAnswers)
    expect(result).toEqual(DONE_RESULT)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns the parsed question when the AI responds with valid JSON', async () => {
    createMock.mockResolvedValueOnce(
      jsonMessage({ done: false, question: 'ลูกค้าหลักของคุณคือใคร?' }),
    )
    const result = await generateFollowupQuestion(
      { businessName: 'ร้านกาแฟ' },
      [],
    )
    expect(result).toEqual({
      done: false,
      question: 'ลูกค้าหลักของคุณคือใคร?',
      type: 'text',
      choices: null,
    })
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('returns a multiple-choice question with its options', async () => {
    createMock.mockResolvedValueOnce(
      jsonMessage({
        done: false,
        question: 'คุณเปิดร้านกี่วันต่อสัปดาห์?',
        type: 'choice',
        choices: ['1-3 วัน', '4-6 วัน', 'ทุกวัน'],
      }),
    )
    const result = await generateFollowupQuestion({}, [])
    expect(result).toEqual({
      done: false,
      question: 'คุณเปิดร้านกี่วันต่อสัปดาห์?',
      type: 'choice',
      choices: ['1-3 วัน', '4-6 วัน', 'ทุกวัน'],
    })
  })

  it('retries once and succeeds when the first reply is malformed JSON', async () => {
    createMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'not json' } }] })
      .mockResolvedValueOnce(
        jsonMessage({ done: false, question: 'ลูกค้าส่วนใหญ่มาจากไหน?' }),
      )
    const result = await generateFollowupQuestion({}, [])
    expect(result.question).toBe('ลูกค้าส่วนใหญ่มาจากไหน?')
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails safe to done:true when the AI returns malformed JSON twice in a row', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    })
    const result = await generateFollowupQuestion({}, [])
    expect(result).toEqual(DONE_RESULT)
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails safe to done:true when the AI response fails schema validation twice in a row', async () => {
    createMock.mockResolvedValue(jsonMessage({ foo: 'bar' }))
    const result = await generateFollowupQuestion({}, [])
    expect(result).toEqual(DONE_RESULT)
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('retries once and keeps the new question when the first candidate repeats a previous one', async () => {
    const previousAnswers = [
      { question: 'ลูกค้าหลักของคุณคือใคร?', answer: 'วัยทำงาน' },
    ]
    createMock
      .mockResolvedValueOnce(
        jsonMessage({ done: false, question: 'ลูกค้าหลักของคุณคือใคร?' }),
      )
      .mockResolvedValueOnce(
        jsonMessage({ done: false, question: 'ลูกค้ามาจากช่องทางไหนบ่อยที่สุด?' }),
      )
    const result = await generateFollowupQuestion({}, previousAnswers)
    expect(result.question).toBe('ลูกค้ามาจากช่องทางไหนบ่อยที่สุด?')
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the original candidate if the repeat-retry itself fails to parse', async () => {
    const previousAnswers = [
      { question: 'ลูกค้าหลักของคุณคือใคร?', answer: 'วัยทำงาน' },
    ]
    createMock
      .mockResolvedValueOnce(
        jsonMessage({ done: false, question: 'ลูกค้าหลักของคุณคือใคร?' }),
      )
      .mockResolvedValueOnce({ choices: [{ message: { content: 'not json' } }] })
    const result = await generateFollowupQuestion({}, previousAnswers)
    expect(result.question).toBe('ลูกค้าหลักของคุณคือใคร?')
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('rethrows AiNotConfiguredError instead of failing safe', async () => {
    createMock.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    await expect(generateFollowupQuestion({}, [])).rejects.toBeInstanceOf(
      AiNotConfiguredError,
    )
  })

  it('wraps an all-tiers-exhausted error from the cascade', async () => {
    createMock.mockImplementationOnce(() => {
      throw new AllTiersExhaustedError('all tiers exhausted')
    })
    await expect(generateFollowupQuestion({}, [])).rejects.toBeInstanceOf(
      AiRateLimitError,
    )
  })
})
