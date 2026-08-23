import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    ad: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    adCreative: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('./meta-publish.service.js', () => ({
  syncAdCreativeChangeToMeta: vi.fn(),
}))

import { prisma } from '../db/client.js'
import { syncAdCreativeChangeToMeta } from './meta-publish.service.js'
import { updateAd, AdValidationError } from './ad.service.js'

function baseAd(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ad-1',
    adSetId: 'adset-1',
    creativeId: 'creative-1',
    userId: 'user-1',
    name: 'Ad 1',
    metaAdId: null,
    metaStatus: null,
    metaEffectiveStatus: null,
    metaReviewFeedback: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('updateAd', () => {
  beforeEach(() => {
    vi.mocked(prisma.ad.findFirst).mockReset()
    vi.mocked(prisma.ad.updateMany)
      .mockReset()
      .mockResolvedValue({ count: 1 })
    vi.mocked(prisma.adCreative.findFirst).mockReset()
    vi.mocked(syncAdCreativeChangeToMeta).mockReset()
  })

  it('returns null when the ad is not found', async () => {
    vi.mocked(prisma.ad.findFirst).mockResolvedValueOnce(null)
    const result = await updateAd('user-1', 'campaign-1', 'adset-1', 'ad-1', {
      name: 'New name',
    })
    expect(result).toBeNull()
    expect(prisma.ad.updateMany).not.toHaveBeenCalled()
  })

  it('throws AdValidationError when the target creative is not owned by this ad set', async () => {
    vi.mocked(prisma.ad.findFirst).mockResolvedValueOnce(baseAd() as never)
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce(null)
    await expect(
      updateAd('user-1', 'campaign-1', 'adset-1', 'ad-1', {
        creativeId: 'creative-2',
      }),
    ).rejects.toBeInstanceOf(AdValidationError)
    expect(prisma.ad.updateMany).not.toHaveBeenCalled()
  })

  it('saves a name-only update locally without touching Meta, even if already published', async () => {
    vi.mocked(prisma.ad.findFirst).mockResolvedValueOnce(
      baseAd({ metaAdId: 'meta-ad-1' }) as never,
    )
    await updateAd('user-1', 'campaign-1', 'adset-1', 'ad-1', {
      name: 'New name',
    })
    expect(prisma.ad.updateMany).toHaveBeenCalledWith({
      where: { id: 'ad-1', adSetId: 'adset-1', userId: 'user-1' },
      data: { name: 'New name' },
    })
    expect(syncAdCreativeChangeToMeta).not.toHaveBeenCalled()
  })

  it('syncs to Meta when an already-published ad is repointed to a different creative', async () => {
    vi.mocked(prisma.ad.findFirst).mockResolvedValueOnce(
      baseAd({ metaAdId: 'meta-ad-1' }) as never,
    )
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce({
      id: 'creative-2',
    } as never)
    await updateAd('user-1', 'campaign-1', 'adset-1', 'ad-1', {
      creativeId: 'creative-2',
    })
    expect(syncAdCreativeChangeToMeta).toHaveBeenCalledWith(
      'user-1',
      'campaign-1',
      'adset-1',
      'ad-1',
    )
  })

  it('does not sync to Meta when the ad is not yet published', async () => {
    vi.mocked(prisma.ad.findFirst).mockResolvedValueOnce(baseAd() as never)
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce({
      id: 'creative-2',
    } as never)
    await updateAd('user-1', 'campaign-1', 'adset-1', 'ad-1', {
      creativeId: 'creative-2',
    })
    expect(syncAdCreativeChangeToMeta).not.toHaveBeenCalled()
  })
})
