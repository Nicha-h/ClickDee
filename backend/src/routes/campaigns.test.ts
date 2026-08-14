import { describe, expect, it, vi } from 'vitest'

const { sampleCampaign } = vi.hoisted(() => ({
  sampleCampaign: {
    id: 'campaign-1',
    name: 'Launch',
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
}))

import { app } from '../app.js'

describe('GET /api/campaigns', () => {
  it('returns the serialized campaign list', async () => {
    const res = await app.request('/api/campaigns')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([
      {
        id: 'campaign-1',
        name: 'Launch',
        status: 'DRAFT',
        budget: '1500.00',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])
  })
})
