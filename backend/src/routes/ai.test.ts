import { describe, expect, it, vi } from 'vitest'

const { sampleUserMessage, sampleAssistantMessage } = vi.hoisted(() => ({
  sampleUserMessage: {
    id: 'message-1',
    conversationId: 'conversation-1',
    role: 'USER',
    content: 'สวัสดี',
    list: [],
    closing: null,
    redacted: false,
    pendingAction: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  sampleAssistantMessage: {
    id: 'message-2',
    conversationId: 'conversation-1',
    role: 'ASSISTANT',
    content: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ',
    list: [],
    closing: null,
    redacted: false,
    pendingAction: null,
    createdAt: new Date('2026-01-01T00:00:01.000Z'),
  },
}))

vi.mock('../services/ai.service.js', () => ({
  getConversationMessages: vi
    .fn()
    .mockResolvedValue([sampleUserMessage, sampleAssistantMessage]),
  sendMessage: vi.fn().mockResolvedValue({
    userMessage: sampleUserMessage,
    assistantMessages: [sampleAssistantMessage],
  }),
}))

vi.mock('../services/pending-ai-action.service.js', () => ({
  confirmPendingAction: vi.fn(),
  cancelPendingAction: vi.fn(),
}))

vi.mock('../services/campaign.service.js', () => ({
  listCampaigns: vi.fn().mockResolvedValue([]),
  getCampaignById: vi.fn().mockResolvedValue(null),
}))

vi.mock('../services/insight-ai.service.js', () => ({
  generateInsights: vi.fn().mockResolvedValue({ insights: [] }),
}))

vi.mock('../services/idea-ai.service.js', () => ({
  generateCampaignIdeas: vi.fn().mockResolvedValue({ ideas: [] }),
  generateCreativeIdeas: vi.fn().mockResolvedValue({ ideas: [] }),
}))

vi.mock('../services/creative-ai.service.js', () => ({
  generateCreativeCaption: vi.fn(),
}))

vi.mock('../services/user.service.js', () => ({
  findUserById: vi.fn().mockResolvedValue(null),
}))

const { isAiConfiguredMock } = vi.hoisted(() => ({
  isAiConfiguredMock: vi.fn(),
}))

vi.mock('../lib/openai.js', async () => {
  const actual =
    await vi.importActual<typeof import('../lib/openai.js')>('../lib/openai.js')
  return {
    ...actual,
    isAiConfigured: isAiConfiguredMock,
  }
})

import { app } from '../app.js'
import * as aiService from '../services/ai.service.js'
import * as pendingActionService from '../services/pending-ai-action.service.js'
import * as campaignService from '../services/campaign.service.js'
import * as insightAiService from '../services/insight-ai.service.js'
import * as ideaAiService from '../services/idea-ai.service.js'
import * as userService from '../services/user.service.js'
import * as creativeAiService from '../services/creative-ai.service.js'
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AiContentFilterError,
} from '../lib/openai.js'
import { signSessionToken } from '../lib/auth.js'

const authHeader = async () => ({
  Cookie: `session=${await signSessionToken('user-1')}`,
})
const csrfHeader = { 'X-Requested-With': 'XMLHttpRequest' }

describe('GET /api/ai/messages', () => {
  it('returns the serialized conversation history', async () => {
    const res = await app.request('/api/ai/messages', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      {
        id: 'message-1',
        role: 'user',
        text: 'สวัสดี',
        list: null,
        closing: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        pendingAction: null,
        redacted: false,
      },
      {
        id: 'message-2',
        role: 'assistant',
        text: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ',
        list: null,
        closing: null,
        createdAt: '2026-01-01T00:00:01.000Z',
        pendingAction: null,
        redacted: false,
      },
    ])
  })
})

describe('GET /api/ai/messages content warnings', () => {
  it("flags a staged budget above the user's stated monthly budget", async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce({
      budget: '5k-20k',
    } as never)
    vi.mocked(aiService.getConversationMessages).mockResolvedValueOnce([
      {
        ...sampleAssistantMessage,
        pendingAction: {
          id: 'action-1',
          type: 'CREATE',
          targetCampaignId: null,
          payload: { name: 'โปรลาเต้', budget: 500_000 },
          status: 'PENDING',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      },
    ] as never)
    const res = await app.request('/api/ai/messages', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    const [message] = await res.json()
    expect(message.pendingAction.contentWarnings).toEqual([
      expect.stringMatching(/^งบประมาณ \(500,000 บาท\)/),
    ])
  })
})

describe('POST /api/ai/campaigns/:id/creative', () => {
  it('returns the suggested caption with content warnings', async () => {
    vi.mocked(campaignService.getCampaignById).mockResolvedValueOnce({
      id: 'campaign-1',
    } as never)
    vi.mocked(creativeAiService.generateCreativeCaption).mockResolvedValueOnce(
      'รับประกันผล 100% สั่งเลยที่ https://evil.example',
    )
    const res = await app.request('/api/ai/campaigns/campaign-1/creative', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...(await authHeader()),
      },
      body: JSON.stringify({ prompt: 'โปรโมทส่วนลด' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.caption).toBe(
      'รับประกันผล 100% สั่งเลยที่ https://evil.example',
    )
    expect(body.contentWarnings).toEqual([
      expect.stringMatching(/^แคปชั่น: มีลิงก์/),
      expect.stringMatching(/^แคปชั่น: มีคำกล่าวอ้าง/),
    ])
  })
})

describe('POST /api/ai/messages', () => {
  const sendRequest = async (body: unknown) =>
    app.request('/api/ai/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...(await authHeader()),
      },
      body: JSON.stringify(body),
    })

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/ai/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...csrfHeader },
      body: JSON.stringify({ text: 'สวัสดี' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when the CSRF header is missing, even with a valid cookie', async () => {
    const res = await app.request('/api/ai/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader()),
      },
      body: JSON.stringify({ text: 'สวัสดี' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns the user + assistant messages on success', async () => {
    const res = await sendRequest({ text: 'สวัสดี' })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.userMessage.text).toBe('สวัสดี')
    expect(body.assistantMessages).toHaveLength(1)
    expect(body.assistantMessages[0].role).toBe('assistant')
  })

  it('maps AiNotConfiguredError to 503', async () => {
    vi.mocked(aiService.sendMessage).mockRejectedValueOnce(
      new AiNotConfiguredError(),
    )
    const res = await sendRequest({ text: 'สวัสดี' })
    expect(res.status).toBe(503)
  })

  it('maps AiRateLimitError to 429', async () => {
    vi.mocked(aiService.sendMessage).mockRejectedValueOnce(
      new AiRateLimitError(),
    )
    const res = await sendRequest({ text: 'สวัสดี' })
    expect(res.status).toBe(429)
  })

  it('maps AiContentFilterError to 422', async () => {
    vi.mocked(aiService.sendMessage).mockRejectedValueOnce(
      new AiContentFilterError(),
    )
    const res = await sendRequest({ text: 'สวัสดี' })
    expect(res.status).toBe(422)
  })
})

describe('POST /api/ai/actions/:id/confirm', () => {
  const sendRequest = async (body: unknown) =>
    app.request('/api/ai/actions/action-1/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...(await authHeader()),
      },
      body: JSON.stringify(body),
    })

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/ai/actions/action-1/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...csrfHeader },
      body: JSON.stringify({ publish: false }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when the CSRF header is missing', async () => {
    const res = await app.request('/api/ai/actions/action-1/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ publish: false }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 200 with the created campaignId on success', async () => {
    vi.mocked(pendingActionService.confirmPendingAction).mockResolvedValueOnce({
      outcome: 'confirmed',
      campaignId: 'campaign-1',
    })
    const res = await sendRequest({ publish: true })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ campaignId: 'campaign-1', status: 'CONFIRMED' })
    expect(pendingActionService.confirmPendingAction).toHaveBeenCalledWith(
      'user-1',
      'action-1',
      true,
    )
  })

  it('returns 404 when the pending action is not found', async () => {
    vi.mocked(pendingActionService.confirmPendingAction).mockResolvedValueOnce({
      outcome: 'notFound',
    })
    const res = await sendRequest({ publish: false })
    expect(res.status).toBe(404)
  })

  it('returns 404 when the target campaign is gone', async () => {
    vi.mocked(pendingActionService.confirmPendingAction).mockResolvedValueOnce({
      outcome: 'targetGone',
    })
    const res = await sendRequest({ publish: false })
    expect(res.status).toBe(404)
  })

  it('returns 409 when the action is no longer pending', async () => {
    vi.mocked(pendingActionService.confirmPendingAction).mockResolvedValueOnce({
      outcome: 'invalidState',
      status: 'CANCELED',
    })
    const res = await sendRequest({ publish: false })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/ai/actions/:id/cancel', () => {
  const sendRequest = async () =>
    app.request('/api/ai/actions/action-1/cancel', {
      method: 'POST',
      headers: { ...csrfHeader, ...(await authHeader()) },
    })

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/ai/actions/action-1/cancel', {
      method: 'POST',
      headers: csrfHeader,
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when the CSRF header is missing', async () => {
    const res = await app.request('/api/ai/actions/action-1/cancel', {
      method: 'POST',
      headers: await authHeader(),
    })
    expect(res.status).toBe(403)
  })

  it('returns 200 on success', async () => {
    vi.mocked(pendingActionService.cancelPendingAction).mockResolvedValueOnce({
      outcome: 'canceled',
    })
    const res = await sendRequest()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'CANCELED' })
  })

  it('returns 404 when not found', async () => {
    vi.mocked(pendingActionService.cancelPendingAction).mockResolvedValueOnce({
      outcome: 'notFound',
    })
    const res = await sendRequest()
    expect(res.status).toBe(404)
  })

  it('returns 409 when already resolved', async () => {
    vi.mocked(pendingActionService.cancelPendingAction).mockResolvedValueOnce({
      outcome: 'invalidState',
      status: 'CONFIRMED',
    })
    const res = await sendRequest()
    expect(res.status).toBe(409)
  })
})

describe('GET /api/ai/insights', () => {
  it('returns hasCampaigns:false without calling the AI when there are no campaigns', async () => {
    vi.mocked(campaignService.listCampaigns).mockResolvedValueOnce([])
    const res = await app.request('/api/ai/insights', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ hasCampaigns: false, insights: [] })
    expect(insightAiService.generateInsights).not.toHaveBeenCalled()
  })

  it('returns generated insights when the caller has real campaigns', async () => {
    vi.mocked(campaignService.listCampaigns).mockResolvedValueOnce([
      { id: 'campaign-1' } as never,
    ])
    vi.mocked(insightAiService.generateInsights).mockResolvedValueOnce({
      insights: ['แคมเปญของคุณใช้งบไปแล้วบางส่วนค่ะ'],
    })
    const res = await app.request('/api/ai/insights', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      hasCampaigns: true,
      insights: ['แคมเปญของคุณใช้งบไปแล้วบางส่วนค่ะ'],
    })
  })
})

describe('GET /api/ai/campaigns/:id/insights', () => {
  it('returns 404 when the campaign is not found', async () => {
    vi.mocked(campaignService.getCampaignById).mockResolvedValueOnce(null)
    const res = await app.request('/api/ai/campaigns/campaign-1/insights', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(404)
  })

  it('returns generated insights for the campaign', async () => {
    vi.mocked(campaignService.getCampaignById).mockResolvedValueOnce({
      id: 'campaign-1',
    } as never)
    vi.mocked(insightAiService.generateInsights).mockResolvedValueOnce({
      insights: ['แคมเปญนี้ยังไม่มีแคปชันค่ะ'],
    })
    const res = await app.request('/api/ai/campaigns/campaign-1/insights', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      insights: ['แคมเปญนี้ยังไม่มีแคปชันค่ะ'],
    })
  })
})

describe('GET /api/ai/campaign-ideas', () => {
  it('returns AI-generated ideas grounded in the caller profile', async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce({
      id: 'user-1',
      businessName: 'ร้านทดสอบ',
    } as never)
    vi.mocked(ideaAiService.generateCampaignIdeas).mockResolvedValueOnce({
      ideas: ['เพิ่มลูกค้าใหม่ในรัศมี 3 กม. งบ 200 บาท/วัน'],
    })
    const res = await app.request('/api/ai/campaign-ideas', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ideas: ['เพิ่มลูกค้าใหม่ในรัศมี 3 กม. งบ 200 บาท/วัน'],
    })
  })
})

describe('GET /api/ai/campaigns/:id/creative-ideas', () => {
  it('returns 404 when the campaign is not found', async () => {
    vi.mocked(campaignService.getCampaignById).mockResolvedValueOnce(null)
    const res = await app.request(
      '/api/ai/campaigns/campaign-1/creative-ideas',
      { headers: await authHeader() },
    )
    expect(res.status).toBe(404)
  })

  it('returns AI-generated ideas grounded in the campaign', async () => {
    vi.mocked(campaignService.getCampaignById).mockResolvedValueOnce({
      id: 'campaign-1',
      name: 'โปรทดสอบ',
    } as never)
    vi.mocked(ideaAiService.generateCreativeIdeas).mockResolvedValueOnce({
      ideas: ['โปรโมทส่วนลด 20% เน้นความคุ้มค่า'],
    })
    const res = await app.request(
      '/api/ai/campaigns/campaign-1/creative-ideas',
      { headers: await authHeader() },
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      ideas: ['โปรโมทส่วนลด 20% เน้นความคุ้มค่า'],
    })
  })
})

describe('GET /api/ai/status', () => {
  it('returns active when an AI provider is configured', async () => {
    isAiConfiguredMock.mockReturnValueOnce(true)
    const res = await app.request('/api/ai/status', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'active' })
  })

  it('returns inactive when no AI provider is configured', async () => {
    isAiConfiguredMock.mockReturnValueOnce(false)
    const res = await app.request('/api/ai/status', {
      headers: await authHeader(),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'inactive' })
  })
})
