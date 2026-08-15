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
  findUserById: vi.fn().mockResolvedValue(null),
  deleteUser: vi.fn().mockResolvedValue(sampleUser),
}))

vi.mock('../lib/password.js', () => ({
  verifyPassword: vi.fn().mockResolvedValue(false),
}))

import { app } from '../app.js'
import * as userService from '../services/user.service.js'
import * as passwordLib from '../lib/password.js'
import { signSessionToken } from '../lib/auth.js'

const authHeader = async (userId: string) => ({
  Authorization: `Bearer ${await signSessionToken(userId)}`,
})

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

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and omits passwordHash from the response', async () => {
    vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(sampleUser)
    vi.mocked(passwordLib.verifyPassword).mockResolvedValueOnce(true)
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'business@example.com',
        password: 'password123',
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('user-1')
    expect(body.email).toBe('business@example.com')
    expect(body.passwordHash).toBeUndefined()
  })

  it('returns 401 for a wrong password', async () => {
    vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(sampleUser)
    vi.mocked(passwordLib.verifyPassword).mockResolvedValueOnce(false)
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'business@example.com',
        password: 'wrong-password',
      }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 401 for an unknown email', async () => {
    vi.mocked(userService.findUserByEmail).mockResolvedValueOnce(null)
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody@example.com',
        password: 'password123',
      }),
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/account/:id', () => {
  it('returns the account and omits passwordHash from the response', async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce(sampleUser)
    const res = await app.request('/api/auth/account/user-1', {
      method: 'GET',
      headers: await authHeader('user-1'),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('user-1')
    expect(body.businessName).toBe('ร้านกาแฟบ้านสวน')
    expect(body.passwordHash).toBeUndefined()
  })

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/auth/account/user-1', {
      method: 'GET',
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when the token belongs to a different account', async () => {
    const res = await app.request('/api/auth/account/someone-else', {
      method: 'GET',
      headers: await authHeader('user-1'),
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown user', async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce(null)
    const res = await app.request('/api/auth/account/nobody', {
      method: 'GET',
      headers: await authHeader('nobody'),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/auth/account/:id', () => {
  it('deletes the account with the correct password', async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce(sampleUser)
    vi.mocked(passwordLib.verifyPassword).mockResolvedValueOnce(true)
    const res = await app.request('/api/auth/account/user-1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({ password: 'password123' }),
    })
    expect(res.status).toBe(204)
    expect(userService.deleteUser).toHaveBeenCalledWith('user-1')
  })

  it('returns 401 for a wrong password', async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce(sampleUser)
    vi.mocked(passwordLib.verifyPassword).mockResolvedValueOnce(false)
    const res = await app.request('/api/auth/account/user-1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({ password: 'wrong-password' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when the token belongs to a different account', async () => {
    const res = await app.request('/api/auth/account/someone-else', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({ password: 'password123' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 for an unknown user', async () => {
    vi.mocked(userService.findUserById).mockResolvedValueOnce(null)
    const res = await app.request('/api/auth/account/nobody', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader('nobody')),
      },
      body: JSON.stringify({ password: 'password123' }),
    })
    expect(res.status).toBe(404)
  })
})
