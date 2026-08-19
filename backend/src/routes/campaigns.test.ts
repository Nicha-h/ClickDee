import { describe, expect, it, vi } from 'vitest'

const { sampleCampaign } = vi.hoisted(() => ({
  sampleCampaign: {
    id: 'campaign-1',
    name: 'Launch',
    caption: null,
    status: 'DRAFT',
    budget: { toString: () => '1500.00' },
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
}))

vi.mock('../services/campaign.service.js', () => ({
  listCampaigns: vi.fn().mockResolvedValue([sampleCampaign]),
  getCampaignById: vi.fn().mockResolvedValue(sampleCampaign),
  createCampaign: vi.fn().mockResolvedValue(sampleCampaign),
  updateCampaign: vi.fn().mockResolvedValue({ count: 1 }),
  deleteCampaign: vi.fn().mockResolvedValue(true),
}))

import { app } from '../app.js'
import * as campaignService from '../services/campaign.service.js'
import { signSessionToken } from '../lib/auth.js'

const authHeader = async (userId: string) => ({
  Cookie: `session=${await signSessionToken(userId)}`,
})
const csrfHeader = { 'X-Requested-With': 'XMLHttpRequest' }

describe('GET /api/campaigns', () => {
  it("returns the caller's serialized campaign list", async () => {
    const res = await app.request('/api/campaigns', {
      headers: await authHeader('user-1'),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      {
        id: 'campaign-1',
        name: 'Launch',
        caption: null,
        status: 'DRAFT',
        budget: '1500.00',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    expect(campaignService.listCampaigns).toHaveBeenCalledWith('user-1')
  })

  it('returns 401 without a cookie', async () => {
    const res = await app.request('/api/campaigns')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/campaigns/:id', () => {
  it('returns 404 for a campaign owned by a different user', async () => {
    vi.mocked(campaignService.getCampaignById).mockResolvedValueOnce(null)
    const res = await app.request('/api/campaigns/campaign-1', {
      headers: await authHeader('someone-else'),
    })
    expect(res.status).toBe(404)
    expect(campaignService.getCampaignById).toHaveBeenCalledWith(
      'someone-else',
      'campaign-1',
    )
  })
})

describe('POST /api/campaigns', () => {
  it('creates a campaign owned by the caller', async () => {
    const res = await app.request('/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({
        name: 'Launch',
        budget: 1500,
        startDate: '2026-01-01T00:00:00.000Z',
      }),
    })
    expect(res.status).toBe(201)
    expect(campaignService.createCampaign).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ name: 'Launch' }),
    )
  })

  it('returns 403 when the CSRF header is missing', async () => {
    const res = await app.request('/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({
        name: 'Launch',
        budget: 1500,
        startDate: '2026-01-01T00:00:00.000Z',
      }),
    })
    expect(res.status).toBe(403)
  })
})

describe('PATCH /api/campaigns/:id', () => {
  it('updates a campaign owned by the caller', async () => {
    const res = await app.request('/api/campaigns/campaign-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({ budget: 2000 }),
    })
    expect(res.status).toBe(200)
    expect(campaignService.updateCampaign).toHaveBeenCalledWith(
      'user-1',
      'campaign-1',
      expect.objectContaining({ budget: 2000 }),
    )
  })

  it('returns 404 when no row was updated', async () => {
    vi.mocked(campaignService.updateCampaign).mockResolvedValueOnce({
      count: 0,
    })
    const res = await app.request('/api/campaigns/campaign-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeader,
        ...(await authHeader('someone-else')),
      },
      body: JSON.stringify({ budget: 2000 }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 403 when the CSRF header is missing', async () => {
    const res = await app.request('/api/campaigns/campaign-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(await authHeader('user-1')),
      },
      body: JSON.stringify({ budget: 2000 }),
    })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/campaigns/:id', () => {
  it('deletes a campaign owned by the caller', async () => {
    const res = await app.request('/api/campaigns/campaign-1', {
      method: 'DELETE',
      headers: { ...csrfHeader, ...(await authHeader('user-1')) },
    })
    expect(res.status).toBe(204)
    expect(campaignService.deleteCampaign).toHaveBeenCalledWith(
      'user-1',
      'campaign-1',
    )
  })

  it('returns 404 when nothing was deleted', async () => {
    vi.mocked(campaignService.deleteCampaign).mockResolvedValueOnce(false)
    const res = await app.request('/api/campaigns/campaign-1', {
      method: 'DELETE',
      headers: { ...csrfHeader, ...(await authHeader('someone-else')) },
    })
    expect(res.status).toBe(404)
  })

  it('returns 403 when the CSRF header is missing', async () => {
    const res = await app.request('/api/campaigns/campaign-1', {
      method: 'DELETE',
      headers: await authHeader('user-1'),
    })
    expect(res.status).toBe(403)
  })
})
