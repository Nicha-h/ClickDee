import { describe, expect, it, vi } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    campaign: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}))

import { prisma } from '../db/client.js'
import {
  listCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
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
        caption: undefined,
        status: undefined,
        budget: 1500,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: undefined,
      },
    })
  })

  it('updateCampaign scopes by {id, userId} and only sends provided fields', async () => {
    await updateCampaign('user-1', 'campaign-1', { budget: 2000 })
    expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
      where: { id: 'campaign-1', userId: 'user-1' },
      data: { budget: 2000 },
    })
  })

  it('updateCampaign converts date strings and passes caption/status through', async () => {
    await updateCampaign('user-1', 'campaign-1', {
      caption: 'New caption',
      startDate: '2026-02-01T00:00:00.000Z',
      endDate: null,
      status: 'ACTIVE',
    })
    expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
      where: { id: 'campaign-1', userId: 'user-1' },
      data: {
        caption: 'New caption',
        startDate: new Date('2026-02-01T00:00:00.000Z'),
        endDate: null,
        status: 'ACTIVE',
      },
    })
  })

  it('deleteCampaign scopes by {id, userId} and reports whether a row was deleted', async () => {
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValueOnce({ count: 1 })
    const result = await deleteCampaign('user-1', 'campaign-1')
    expect(prisma.campaign.deleteMany).toHaveBeenCalledWith({
      where: { id: 'campaign-1', userId: 'user-1' },
    })
    expect(result).toBe(true)
  })

  it('deleteCampaign returns false when no row matched (not found or not owned)', async () => {
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValueOnce({ count: 0 })
    const result = await deleteCampaign('user-1', 'campaign-1')
    expect(result).toBe(false)
  })
})
