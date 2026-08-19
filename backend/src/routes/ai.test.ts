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

import { app } from '../app.js'
import * as aiService from '../services/ai.service.js'
import * as pendingActionService from '../services/pending-ai-action.service.js'
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
