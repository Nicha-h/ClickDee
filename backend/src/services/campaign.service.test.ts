import { describe, expect, it, vi } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    campaign: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
    },
  },
}))

import { prisma } from '../db/client.js'
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
} from './campaign.service.js'

describe('campaign.service', () => {
  it('listCampaigns orders by createdAt desc', async () => {
    await listCampaigns()
    expect(prisma.campaign.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    })
  })

  it('getCampaignById looks up by id', async () => {
    await getCampaignById('campaign-1')
    expect(prisma.campaign.findUnique).toHaveBeenCalledWith({
      where: { id: 'campaign-1' },
    })
  })

  it('createCampaign converts date strings and passes budget through', async () => {
    await createCampaign({
      name: 'Launch',
      budget: 1500,
      startDate: '2026-01-01T00:00:00.000Z',
    })
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: {
        name: 'Launch',
        status: undefined,
        budget: 1500,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: undefined,
      },
    })
  })
})
