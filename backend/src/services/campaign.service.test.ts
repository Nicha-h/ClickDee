import { describe, expect, it, vi } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    campaign: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
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
  it('listCampaigns scopes by userId and orders by createdAt desc', async () => {
    await listCampaigns('user-1')
    expect(prisma.campaign.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('getCampaignById looks up by id scoped to the owner', async () => {
    await getCampaignById('user-1', 'campaign-1')
    expect(prisma.campaign.findFirst).toHaveBeenCalledWith({
      where: { id: 'campaign-1', userId: 'user-1' },
    })
  })

  it('createCampaign sets the owner, converts date strings, and passes budget through', async () => {
    await createCampaign('user-1', {
      name: 'Launch',
      budget: 1500,
      startDate: '2026-01-01T00:00:00.000Z',
    })
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        name: 'Launch',
        status: undefined,
        budget: 1500,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: undefined,
      },
    })
  })
})
