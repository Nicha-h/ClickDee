import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CampaignModel } from '../generated/prisma/models.js'

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

import { generateInsights } from './insight-ai.service.js'
import { AiNotConfiguredError, AllTiersExhaustedError } from '../lib/openai.js'

beforeEach(() => {
  createMock.mockReset()
})

function jsonMessage(content: unknown) {
  return { choices: [{ message: { content: JSON.stringify(content) } }] }
}

function makeCampaign(overrides: Partial<CampaignModel> = {}): CampaignModel {
  return {
    id: 'campaign-1',
    userId: 'user-1',
    name: 'โปรทดสอบ',
    caption: 'ลดราคา 20%',
    status: 'ACTIVE',
    budget: { toString: () => '5000' },
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-08-30'),
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-01'),
    ...overrides,
  } as unknown as CampaignModel
}

describe('generateInsights', () => {
  it('returns no insights without calling the AI when there are no campaigns', async () => {
    const result = await generateInsights([])
    expect(result).toEqual({ insights: [] })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns the parsed insights when the AI responds with valid JSON', async () => {
    const campaign = makeCampaign()
    createMock.mockResolvedValueOnce(
      jsonMessage({
        insights: ['แคมเปญนี้ใช้งบไปแล้วบางส่วนและยังไม่สิ้นสุดในเร็วๆ นี้ค่ะ'],
      }),
    )
    const result = await generateInsights([campaign])
    expect(result.insights).toEqual([
      'แคมเปญนี้ใช้งบไปแล้วบางส่วนและยังไม่สิ้นสุดในเร็วๆ นี้ค่ะ',
    ])
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('retries once and succeeds when the first reply is malformed JSON', async () => {
    const campaign = makeCampaign()
    createMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'not json' } }],
      })
      .mockResolvedValueOnce(
        jsonMessage({ insights: ['แคมเปญนี้ยังไม่มีแคปชันค่ะ'] }),
      )
    const result = await generateInsights([campaign])
    expect(result.insights).toHaveLength(1)
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails soft to an empty list when the AI returns malformed JSON twice in a row', async () => {
    const campaign = makeCampaign()
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    })
    const result = await generateInsights([campaign])
    expect(result).toEqual({ insights: [] })
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails soft to an empty list when the AI response fails schema validation twice in a row', async () => {
    const campaign = makeCampaign()
    createMock.mockResolvedValue(jsonMessage({ foo: 'bar' }))
    const result = await generateInsights([campaign])
    expect(result).toEqual({ insights: [] })
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('resolves to an empty list instead of throwing when the client is not configured', async () => {
    const campaign = makeCampaign()
    createMock.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    const result = await generateInsights([campaign])
    expect(result).toEqual({ insights: [] })
  })

  it('resolves to an empty list instead of throwing when all cascade tiers are exhausted', async () => {
    const campaign = makeCampaign()
    createMock.mockImplementationOnce(() => {
      throw new AllTiersExhaustedError('all tiers exhausted')
    })
    const result = await generateInsights([campaign])
    expect(result).toEqual({ insights: [] })
  })
})
