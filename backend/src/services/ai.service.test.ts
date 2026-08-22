import { describe, expect, it, vi, beforeEach } from 'vitest'

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }))
vi.mock('../lib/openai.js', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/openai.js')>('../lib/openai.js')
  return {
    ...actual,
    createChatCompletion: createMock,
  }
})

const {
  conversationFindFirstMock,
  conversationCreateMock,
  messageCreateMock,
  messageFindManyMock,
  userFindUniqueMock,
} = vi.hoisted(() => ({
  conversationFindFirstMock: vi.fn(),
  conversationCreateMock: vi.fn(),
  messageCreateMock: vi.fn(),
  messageFindManyMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
}))
vi.mock('../db/client.js', () => ({
  prisma: {
    conversation: {
      findFirst: conversationFindFirstMock,
      create: conversationCreateMock,
    },
    message: { create: messageCreateMock, findMany: messageFindManyMock },
    user: { findUnique: userFindUniqueMock },
  },
}))

const { getAiMemoryQasMock } = vi.hoisted(() => ({
  getAiMemoryQasMock: vi.fn(),
}))
vi.mock('./onboarding.service.js', () => ({
  getAiMemoryQas: getAiMemoryQasMock,
}))

const { getCampaignByIdMock } = vi.hoisted(() => ({
  getCampaignByIdMock: vi.fn(),
}))
vi.mock('./campaign.service.js', () => ({
  getCampaignById: getCampaignByIdMock,
}))

const { stagePendingActionMock } = vi.hoisted(() => ({
  stagePendingActionMock: vi.fn(),
}))
vi.mock('./pending-ai-action.service.js', async () => {
  const actual = await vi.importActual<
    typeof import('./pending-ai-action.service.js')
  >('./pending-ai-action.service.js')
  return {
    ...actual,
    stagePendingAction: stagePendingActionMock,
  }
})

const { createNotificationMock } = vi.hoisted(() => ({
  createNotificationMock: vi.fn(),
}))
vi.mock('./notification.service.js', () => ({
  createNotification: createNotificationMock,
}))

import { sendMessage } from './ai.service.js'
import {
  AiContentFilterError,
  AiRateLimitError,
  AllTiersExhaustedError,
} from '../lib/openai.js'

beforeEach(() => {
  createMock.mockReset()
  conversationFindFirstMock
    .mockReset()
    .mockResolvedValue({ id: 'conv-1', userId: 'user-1' })
  conversationCreateMock.mockReset()
  messageCreateMock.mockReset().mockImplementation(
    ({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: `msg-${messageCreateMock.mock.calls.length}`,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        list: [],
        closing: null,
        redacted: data.redacted ?? false,
        pendingActionId: data.pendingActionId ?? null,
        pendingAction: null,
        createdAt: new Date(),
      }),
  )
  messageFindManyMock.mockReset().mockResolvedValue([])
  userFindUniqueMock.mockReset().mockResolvedValue(null)
  getAiMemoryQasMock.mockReset().mockResolvedValue([])
  getCampaignByIdMock.mockReset()
  stagePendingActionMock.mockReset()
  createNotificationMock.mockReset()
})

describe('sendMessage', () => {
  it('persists a single assistant message for a plain-text reply', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        { message: { content: 'สวัสดีค่ะ' }, finish_reason: 'stop' },
      ],
    })

    const result = await sendMessage('user-1', 'สวัสดี')

    expect(result.assistantMessages).toHaveLength(1)
    expect(result.assistantMessages[0].content).toBe('สวัสดีค่ะ')
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  it('splits a [[NEXT]]-separated reply into multiple ordered messages', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: { content: 'ส่วนแรกค่ะ\n[[NEXT]]\nส่วนที่สองค่ะ' },
          finish_reason: 'stop',
        },
      ],
    })

    const result = await sendMessage('user-1', 'ช่วยอธิบายหน่อย')

    expect(result.assistantMessages.map((m) => m.content)).toEqual([
      'ส่วนแรกค่ะ',
      'ส่วนที่สองค่ะ',
    ])
  })

  it('stages (never executes) a stage_create_campaign tool call and creates a notification', async () => {
    createMock
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'stage_create_campaign',
                    arguments: JSON.stringify({
                      name: 'โปรร้อนรับหน้าฝน',
                      budget: 3000,
                      startDate: '2026-09-01',
                      caption: 'ลดร้อนรับหน้าฝน!',
                    }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            message: { content: 'กรุณายืนยันการสร้างแคมเปญนี้ค่ะ' },
            finish_reason: 'stop',
          },
        ],
      })
    stagePendingActionMock.mockResolvedValueOnce({
      id: 'action-1',
      type: 'CREATE',
      targetCampaignId: null,
      payload: { name: 'โปรร้อนรับหน้าฝน' },
      status: 'PENDING',
      createdAt: new Date(),
    })

    const result = await sendMessage('user-1', 'ช่วยสร้างแคมเปญให้หน่อย')

    expect(stagePendingActionMock).toHaveBeenCalledWith(
      'user-1',
      'conv-1',
      'CREATE',
      expect.objectContaining({
        name: 'โปรร้อนรับหน้าฝน',
        proposedStatus: 'DRAFT',
      }),
      null,
    )
    // The tool never calls createCampaign directly — staging only.
    expect(getCampaignByIdMock).not.toHaveBeenCalled()
    expect(createNotificationMock).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ type: 'AI_TASK', pendingActionId: 'action-1' }),
    )
    expect(result.assistantMessages).toHaveLength(1)
    expect(result.assistantMessages[0].content).toBe(
      'กรุณายืนยันการสร้างแคมเปญนี้ค่ะ',
    )
  })

  it('verifies ownership before staging a stage_update_campaign tool call', async () => {
    createMock
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'stage_update_campaign',
                    arguments: JSON.stringify({
                      campaignId: 'campaign-1',
                      budget: 5000,
                    }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'ยืนยันไหมคะ' }, finish_reason: 'stop' }],
      })
    getCampaignByIdMock.mockResolvedValueOnce(null)

    await sendMessage('user-1', 'แก้ไขงบแคมเปญหน่อย')

    expect(getCampaignByIdMock).toHaveBeenCalledWith('user-1', 'campaign-1')
    expect(stagePendingActionMock).not.toHaveBeenCalled()
  })

  it('reports invalid tool arguments back to the model instead of staging', async () => {
    createMock
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'stage_create_campaign',
                    arguments: JSON.stringify({
                      name: '',
                      budget: -5,
                      startDate: 'not-a-date',
                      caption: '',
                    }),
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          { message: { content: 'ขอข้อมูลเพิ่มเติมหน่อยค่ะ' }, finish_reason: 'stop' },
        ],
      })

    const result = await sendMessage('user-1', 'สร้างแคมเปญ')

    expect(stagePendingActionMock).not.toHaveBeenCalled()
    expect(result.assistantMessages[0].content).toBe(
      'ขอข้อมูลเพิ่มเติมหน่อยค่ะ',
    )
  })

  it('redacts PII from the user message before persisting and before it reaches the model', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: 'รับทราบค่ะ' }, finish_reason: 'stop' }],
    })

    const result = await sendMessage(
      'user-1',
      'ติดต่อฉันที่ test.user@example.com นะ',
    )

    expect(result.userMessage.content).toContain('[REDACTED_EMAIL]')
    expect(result.userMessage.content).not.toContain('test.user@example.com')
    expect((result.userMessage as { redacted: boolean }).redacted).toBe(true)
  })

  it('throws AiContentFilterError when the completion is content-filtered', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: null }, finish_reason: 'content_filter' }],
    })

    await expect(sendMessage('user-1', 'x')).rejects.toBeInstanceOf(
      AiContentFilterError,
    )
  })

  it('wraps an all-tiers-exhausted error from the cascade', async () => {
    createMock.mockImplementationOnce(() => {
      throw new AllTiersExhaustedError('all tiers exhausted')
    })

    await expect(sendMessage('user-1', 'x')).rejects.toBeInstanceOf(
      AiRateLimitError,
    )
  })
})
