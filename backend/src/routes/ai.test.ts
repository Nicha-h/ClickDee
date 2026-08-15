import { describe, expect, it, vi } from 'vitest'

const { sampleUserMessage, sampleAssistantMessage } = vi.hoisted(() => ({
  sampleUserMessage: {
    id: 'message-1',
    conversationId: 'conversation-1',
    role: 'USER',
    content: 'สวัสดี',
    list: [],
    closing: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  sampleAssistantMessage: {
    id: 'message-2',
    conversationId: 'conversation-1',
    role: 'ASSISTANT',
    content: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ',
    list: [],
    closing: null,
    createdAt: new Date('2026-01-01T00:00:01.000Z'),
  },
}))

vi.mock('../services/ai.service.js', () => ({
  getConversationMessages: vi
    .fn()
    .mockResolvedValue([sampleUserMessage, sampleAssistantMessage]),
  sendMessage: vi.fn().mockResolvedValue({
    userMessage: sampleUserMessage,
    assistantMessage: sampleAssistantMessage,
  }),
}))

import { app } from '../app.js'
import * as aiService from '../services/ai.service.js'
import {
  AiNotConfiguredError,
  AiRateLimitError,
  AiContentFilterError,
} from '../lib/openai.js'
import { signSessionToken } from '../lib/auth.js'

const authHeader = async () => ({
  Authorization: `Bearer ${await signSessionToken('user-1')}`,
})

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
      },
      {
        id: 'message-2',
        role: 'assistant',
        text: 'สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ',
        list: null,
        closing: null,
        createdAt: '2026-01-01T00:00:01.000Z',
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
        ...(await authHeader()),
      },
      body: JSON.stringify(body),
    })

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/ai/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'สวัสดี' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns the user + assistant messages on success', async () => {
    const res = await sendRequest({ text: 'สวัสดี' })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.userMessage.text).toBe('สวัสดี')
    expect(body.assistantMessage.role).toBe('assistant')
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
