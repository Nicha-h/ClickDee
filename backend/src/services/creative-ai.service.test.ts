import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CampaignModel } from '../generated/prisma/models.js'

const { createMock, researchForCaptionMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  researchForCaptionMock: vi.fn(),
}))

vi.mock('../lib/openai.js', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/openai.js')>('../lib/openai.js')
  return {
    ...actual,
    createChatCompletion: createMock,
  }
})

vi.mock('../lib/compound.js', () => ({
  researchForCaption: researchForCaptionMock,
}))

import {
  generateCreativeCaption,
  CreativeGenerationError,
} from './creative-ai.service.js'
import { AiNotConfiguredError } from '../lib/openai.js'

beforeEach(() => {
  createMock.mockReset()
  researchForCaptionMock.mockReset().mockResolvedValue(null)
})

function jsonMessage(content: unknown) {
  return { choices: [{ message: { content: JSON.stringify(content) } }] }
}

function makeCampaign(
  overrides: Partial<CampaignModel> = {},
): Pick<CampaignModel, 'name' | 'caption' | 'budget'> {
  return {
    name: 'โปรทดสอบ',
    caption: 'ลดราคา 20%',
    budget: { toString: () => '5000' },
    ...overrides,
  } as unknown as Pick<CampaignModel, 'name' | 'caption' | 'budget'>
}

describe('generateCreativeCaption', () => {
  it('returns the parsed caption when the AI responds with valid JSON', async () => {
    createMock.mockResolvedValueOnce(
      jsonMessage({ caption: 'ลองลาเต้คาราเมลใหม่วันนี้ อบอุ่นถึงใจ' }),
    )
    const caption = await generateCreativeCaption(
      makeCampaign(),
      'แนะนำเมนูใหม่ ลาเต้คาราเมล',
    )
    expect(caption).toBe('ลองลาเต้คาราเมลใหม่วันนี้ อบอุ่นถึงใจ')
    expect(researchForCaptionMock).toHaveBeenCalledWith({
      name: 'โปรทดสอบ',
      budget: 5000,
      caption: 'แนะนำเมนูใหม่ ลาเต้คาราเมล',
    })
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('includes research findings in the prompt when available', async () => {
    researchForCaptionMock.mockResolvedValueOnce('ผลวิจัย: ช่วงนี้ฝนตกบ่อย')
    createMock.mockResolvedValueOnce(jsonMessage({ caption: 'ครีเอทีฟใหม่' }))
    await generateCreativeCaption(makeCampaign(), 'โปรฝนตก')
    const callArgs = createMock.mock.calls[0][0]
    const userMessage = callArgs.messages.find(
      (m: { role: string }) => m.role === 'user',
    )
    expect(userMessage.content).toContain('ผลวิจัย: ช่วงนี้ฝนตกบ่อย')
  })

  it('throws CreativeGenerationError when the model returns non-JSON content', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json' } }],
    })
    await expect(
      generateCreativeCaption(makeCampaign(), 'โปรใหม่'),
    ).rejects.toThrow(CreativeGenerationError)
  })

  it('throws CreativeGenerationError when the model JSON fails schema validation', async () => {
    createMock.mockResolvedValueOnce(jsonMessage({ foo: 'bar' }))
    await expect(
      generateCreativeCaption(makeCampaign(), 'โปรใหม่'),
    ).rejects.toThrow(CreativeGenerationError)
  })

  it('throws CreativeGenerationError when the model returns empty content', async () => {
    createMock.mockResolvedValueOnce({ choices: [{ message: {} }] })
    await expect(
      generateCreativeCaption(makeCampaign(), 'โปรใหม่'),
    ).rejects.toThrow(CreativeGenerationError)
  })

  it('propagates AI provider errors instead of swallowing them', async () => {
    createMock.mockImplementationOnce(() => {
      throw new AiNotConfiguredError()
    })
    await expect(
      generateCreativeCaption(makeCampaign(), 'โปรใหม่'),
    ).rejects.toThrow(AiNotConfiguredError)
  })
})
