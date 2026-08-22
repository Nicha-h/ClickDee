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

import { generateRecommendations } from './recommendation-ai.service.js'
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

describe('generateRecommendations', () => {
  it('returns no recommendations without calling the AI when there are no campaigns', async () => {
    const result = await generateRecommendations([])
    expect(result).toEqual({ recommendations: [] })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns the parsed recommendations when the AI responds with valid JSON', async () => {
    const campaign = makeCampaign()
    createMock.mockResolvedValueOnce(
      jsonMessage({
        recommendations: [
          {
            campaignId: campaign.id,
            title: 'แคมเปญใกล้หมดเวลา',
            description: 'แคมเปญนี้จะสิ้นสุดเร็วๆ นี้ ลองพิจารณาขยายเวลา',
            actionLabel: 'ดูแคมเปญ',
          },
        ],
      }),
    )
    const result = await generateRecommendations([campaign])
    expect(result.recommendations).toEqual([
      {
        campaignId: campaign.id,
        title: 'แคมเปญใกล้หมดเวลา',
        description: 'แคมเปญนี้จะสิ้นสุดเร็วๆ นี้ ลองพิจารณาขยายเวลา',
        actionLabel: 'ดูแคมเปญ',
      },
    ])
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('retries once and succeeds when the first reply is malformed JSON', async () => {
    const campaign = makeCampaign()
    createMock
      .mockResolvedValueOnce({ choices: [{ message: { content: 'not json' } }] })
      .mockResolvedValueOnce(
        jsonMessage({
          recommendations: [
            {
              campaignId: campaign.id,
              title: 'เพิ่มแคปชัน',
              description: 'แคมเปญนี้ยังไม่มีแคปชัน ลองเพิ่มข้อความโปรโมท',
              actionLabel: 'เพิ่มแคปชัน',
            },
          ],
        }),
      )
    const result = await generateRecommendations([campaign])
    expect(result.recommendations).toHaveLength(1)
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails soft to an empty list when the AI returns malformed JSON twice in a row', async () => {
    const campaign = makeCampaign()
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    })
    const result = await generateRecommendations([campaign])
    expect(result).toEqual({ recommendations: [] })
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails soft to an empty list when the AI response fails schema validation twice in a row', async () => {
    const campaign = makeCampaign()
    createMock.mockResolvedValue(jsonMessage({ foo: 'bar' }))
    const result = await generateRecommendations([campaign])
    expect(result).toEqual({ recommendations: [] })
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('drops recommendations that reference an unknown campaignId', async () => {
    const campaign = makeCampaign()
    createMock
      .mockResolvedValueOnce(
        jsonMessage({
          recommendations: [
            {
              campaignId: 'not-a-real-campaign',
              title: 'ผิด',
              description: 'ผิด',
              actionLabel: 'ผิด',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        jsonMessage({
          recommendations: [
            {
              campaignId: campaign.id,
              title: 'ถูกต้อง',
              description: 'แนะนำที่ถูกต้อง',
              actionLabel: 'ดูแคมเปญ',
            },
          ],
        }),
      )
    const result = await generateRecommendations([campaign])
    expect(result.recommendations).toEqual([
      {
        campaignId: campaign.id,
        title: 'ถูกต้อง',
        description: 'แนะนำที่ถูกต้อง',
        actionLabel: 'ดูแคมเปญ',
      },
    ])
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('resolves to an empty list instead of throwing when the client is not configured', async () => {
    const campaign = makeCampaign()
    createMock.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    const result = await generateRecommendations([campaign])
    expect(result).toEqual({ recommendations: [] })
  })

  it('resolves to an empty list instead of throwing when all cascade tiers are exhausted', async () => {
    const campaign = makeCampaign()
    createMock.mockImplementationOnce(() => {
      throw new AllTiersExhaustedError('all tiers exhausted')
    })
    const result = await generateRecommendations([campaign])
    expect(result).toEqual({ recommendations: [] })
  })
})
