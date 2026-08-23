import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CampaignModel, UserModel } from '../generated/prisma/models.js'

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

import {
  generateCampaignIdeas,
  generateCreativeIdeas,
} from './idea-ai.service.js'
import { AiNotConfiguredError } from '../lib/openai.js'

beforeEach(() => {
  createMock.mockReset()
})

function jsonMessage(content: unknown) {
  return { choices: [{ message: { content: JSON.stringify(content) } }] }
}

function makeUser(overrides: Partial<UserModel> = {}): UserModel {
  return {
    id: 'user-1',
    businessName: 'ร้านกาแฟทดสอบ',
    category: 'คาเฟ่',
    goal: 'เพิ่มลูกค้าใหม่',
    location: 'สีลม',
    signatureProduct: 'ลาเต้คาราเมล',
    adExperience: null,
    budget: '5000',
    platforms: [],
    ...overrides,
  } as unknown as UserModel
}

function makeCampaign(
  overrides: Partial<CampaignModel> = {},
): Pick<CampaignModel, 'name' | 'caption'> {
  return {
    name: 'โปรทดสอบ',
    caption: 'ลดราคา 20%',
    ...overrides,
  } as unknown as Pick<CampaignModel, 'name' | 'caption'>
}

describe('generateCampaignIdeas', () => {
  it('returns no ideas without calling the AI when the user has no business profile', async () => {
    const result = await generateCampaignIdeas(null)
    expect(result).toEqual({ ideas: [] })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('returns the parsed ideas when the AI responds with valid JSON', async () => {
    createMock.mockResolvedValueOnce(
      jsonMessage({ ideas: ['เพิ่มลูกค้าใหม่ในรัศมี 3 กม. งบ 200 บาท/วัน'] }),
    )
    const result = await generateCampaignIdeas(makeUser())
    expect(result.ideas).toEqual([
      'เพิ่มลูกค้าใหม่ในรัศมี 3 กม. งบ 200 บาท/วัน',
    ])
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('retries once and succeeds when the first reply is malformed JSON', async () => {
    createMock
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'not json' } }],
      })
      .mockResolvedValueOnce(jsonMessage({ ideas: ['โปรลาเต้คาราเมล'] }))
    const result = await generateCampaignIdeas(makeUser())
    expect(result.ideas).toHaveLength(1)
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('fails soft to an empty list when the AI returns malformed JSON twice in a row', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    })
    const result = await generateCampaignIdeas(makeUser())
    expect(result).toEqual({ ideas: [] })
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  it('resolves to an empty list instead of throwing when the client is not configured', async () => {
    createMock.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    const result = await generateCampaignIdeas(makeUser())
    expect(result).toEqual({ ideas: [] })
  })
})

describe('generateCreativeIdeas', () => {
  it('grounds the prompt in the campaign even without a user profile', async () => {
    createMock.mockResolvedValueOnce(
      jsonMessage({ ideas: ['โปรโมทส่วนลด 20% เน้นความคุ้มค่า'] }),
    )
    const result = await generateCreativeIdeas(makeCampaign(), null)
    expect(result.ideas).toEqual(['โปรโมทส่วนลด 20% เน้นความคุ้มค่า'])
    const callArgs = createMock.mock.calls[0][0]
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === 'user',
    )
    expect(userMessage.content).toContain('โปรทดสอบ')
  })

  it('fails soft to an empty list when the AI response fails schema validation twice in a row', async () => {
    createMock.mockResolvedValue(jsonMessage({ foo: 'bar' }))
    const result = await generateCreativeIdeas(makeCampaign(), makeUser())
    expect(result).toEqual({ ideas: [] })
    expect(createMock).toHaveBeenCalledTimes(2)
  })
})
