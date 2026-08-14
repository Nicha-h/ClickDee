import { describe, expect, it, vi } from 'vitest'

const { sampleUser } = vi.hoisted(() => ({
  sampleUser: {
    id: 'user-1',
    email: 'business@example.com',
    passwordHash: 'salt:hash',
    businessName: 'ร้านกาแฟบ้านสวน',
    location: 'สีลม',
    category: 'cafe',
    categoryOther: null,
    adExperience: 'never',
    budget: '5k-20k',
    goal: 'sales',
    signatureProduct: 'ลาเต้เย็น',
    platforms: ['facebook'],
    peakHours: 'morning',
    promoHighlight: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
}))

vi.mock('../services/user.service.js', () => ({
  findUserByEmail: vi.fn().mockResolvedValue(null),
  createUser: vi.fn().mockResolvedValue(sampleUser),
}))

import { app } from '../app.js'
import * as userService from '../services/user.service.js'

describe('POST /api/auth/signup', () => {
  it('creates an account and omits passwordHash from the response', async () => {
    const res = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'business@example.com',
        password: 'password123',
        businessName: 'ร้านกาแฟบ้านสวน',
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('user-1')
    expect(body.email).toBe('business@example.com')
    expect(body.passwordHash).toBeUndefined()
  })

  it('returns 409 when the email is already registered', async () => {
    vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(sampleUser)
    const res = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'business@example.com',
        password: 'password123',
      }),
    })
    expect(res.status).toBe(409)
  })
})
