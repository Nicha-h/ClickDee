import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    campaign: { findFirst: vi.fn() },
    adSet: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

import { prisma } from '../db/client.js'
import { createAdSet, AdSetValidationError } from './ad-set.service.js'

function baseInput() {
  return {
    name: 'Ad Set 1',
    optimizationGoal: 'LINK_CLICKS' as const,
    billingEvent: 'IMPRESSIONS' as const,
    targeting: { targeting_automation: { advantage_audience: 1 as const } },
    advantagePlacements: true,
  }
}

describe('ad-set.service createAdSet', () => {
  beforeEach(() => {
    vi.mocked(prisma.campaign.findFirst).mockReset()
    vi.mocked(prisma.adSet.create)
      .mockReset()
      .mockResolvedValue({ id: 'adset-1' })
  })

  it('returns null when the parent campaign is not found or not owned', async () => {
    vi.mocked(prisma.campaign.findFirst).mockResolvedValueOnce(null)
    const result = await createAdSet('user-1', 'campaign-1', baseInput())
    expect(result).toBeNull()
    expect(prisma.adSet.create).not.toHaveBeenCalled()
  })

  it('creates the ad set when the objective does not require a promoted object', async () => {
    vi.mocked(prisma.campaign.findFirst).mockResolvedValueOnce({
      objective: 'OUTCOME_TRAFFIC',
    })
    await createAdSet('user-1', 'campaign-1', baseInput())
    expect(prisma.adSet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          campaignId: 'campaign-1',
          userId: 'user-1',
        }),
      }),
    )
  })

  it('throws when OUTCOME_LEADS campaign is missing a promoted object', async () => {
    vi.mocked(prisma.campaign.findFirst).mockResolvedValueOnce({
      objective: 'OUTCOME_LEADS',
    })
    await expect(
      createAdSet('user-1', 'campaign-1', baseInput()),
    ).rejects.toBeInstanceOf(AdSetValidationError)
    expect(prisma.adSet.create).not.toHaveBeenCalled()
  })

  it('throws when OUTCOME_APP_PROMOTION campaign has a promoted object but no destination type', async () => {
    vi.mocked(prisma.campaign.findFirst).mockResolvedValueOnce({
      objective: 'OUTCOME_APP_PROMOTION',
    })
    await expect(
      createAdSet('user-1', 'campaign-1', {
        ...baseInput(),
        promotedObject: {
          application_id: '123',
          object_store_url: 'https://...',
        },
      }),
    ).rejects.toBeInstanceOf(AdSetValidationError)
  })

  it('succeeds for OUTCOME_LEADS when promoted object and destination type are both set', async () => {
    vi.mocked(prisma.campaign.findFirst).mockResolvedValueOnce({
      objective: 'OUTCOME_LEADS',
    })
    await createAdSet('user-1', 'campaign-1', {
      ...baseInput(),
      promotedObject: { page_id: 'page-1' },
      destinationType: 'ON_AD',
    })
    expect(prisma.adSet.create).toHaveBeenCalled()
  })
})
