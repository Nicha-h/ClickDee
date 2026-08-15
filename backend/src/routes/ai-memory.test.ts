import { describe, expect, it, vi } from 'vitest'

const { sampleItem } = vi.hoisted(() => ({
  sampleItem: {
    id: 'memory-1',
    question: 'ลูกค้าหลักของคุณคือใคร?',
    answer: 'พนักงานออฟฟิศ',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
}))

vi.mock('../services/onboarding.service.js', () => ({
  getAiMemoryItems: vi.fn().mockResolvedValue([sampleItem]),
  deleteAiMemoryItem: vi.fn().mockResolvedValue({ count: 1 }),
  clearAiMemory: vi.fn().mockResolvedValue({ count: 2 }),
}))

import { app } from '../app.js'
import * as onboardingService from '../services/onboarding.service.js'
import { signSessionToken } from '../lib/auth.js'

const authHeader = async (userId: string) => ({
  Cookie: `session=${await signSessionToken(userId)}`,
})
const csrfHeader = { 'X-Requested-With': 'XMLHttpRequest' }

describe('GET /api/ai-memory', () => {
  it("returns the caller's AI memory items", async () => {
    const res = await app.request('/api/ai-memory', {
      headers: await authHeader('user-1'),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      {
        id: 'memory-1',
        question: 'ลูกค้าหลักของคุณคือใคร?',
        answer: 'พนักงานออฟฟิศ',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    expect(onboardingService.getAiMemoryItems).toHaveBeenCalledWith('user-1')
  })

  it('returns 401 without a cookie', async () => {
    const res = await app.request('/api/ai-memory')
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/ai-memory/:id', () => {
  it('deletes the item scoped to the caller', async () => {
    const res = await app.request('/api/ai-memory/memory-1', {
      method: 'DELETE',
      headers: { ...csrfHeader, ...(await authHeader('user-1')) },
    })
    expect(res.status).toBe(204)
    expect(onboardingService.deleteAiMemoryItem).toHaveBeenCalledWith(
      'user-1',
      'memory-1',
    )
  })

  it("returns 404 when the item isn't found or isn't the caller's", async () => {
    vi.mocked(onboardingService.deleteAiMemoryItem).mockResolvedValueOnce({
      count: 0,
    })
    const res = await app.request('/api/ai-memory/someone-elses-item', {
      method: 'DELETE',
      headers: { ...csrfHeader, ...(await authHeader('user-1')) },
    })
    expect(res.status).toBe(404)
  })

  it('returns 403 when the CSRF header is missing', async () => {
    const res = await app.request('/api/ai-memory/memory-1', {
      method: 'DELETE',
      headers: await authHeader('user-1'),
    })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/ai-memory', () => {
  it("clears all of the caller's AI memory", async () => {
    const res = await app.request('/api/ai-memory', {
      method: 'DELETE',
      headers: { ...csrfHeader, ...(await authHeader('user-1')) },
    })
    expect(res.status).toBe(204)
    expect(onboardingService.clearAiMemory).toHaveBeenCalledWith('user-1')
  })
})
