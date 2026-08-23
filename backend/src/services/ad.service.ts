import { prisma } from '../db/client.js'
import type { CreateAdInput, UpdateAdInput } from '../schemas/ad.schema.js'
import { syncAdCreativeChangeToMeta } from './meta-publish.service.js'

export class AdValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdValidationError'
  }
}

export function listAds(userId: string, adSetId: string) {
  return prisma.ad.findMany({
    where: { adSetId, userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAd(
  userId: string,
  campaignId: string,
  adSetId: string,
  input: CreateAdInput,
) {
  const adSet = await prisma.adSet.findFirst({
    where: { id: adSetId, campaignId, userId },
  })
  if (!adSet) return null

  const creative = await prisma.adCreative.findFirst({
    where: { id: input.creativeId, adSetId, userId },
  })
  if (!creative) return null

  return prisma.ad.create({
    data: {
      adSetId,
      creativeId: input.creativeId,
      userId,
      name: input.name,
    },
  })
}

export function getAdById(userId: string, adSetId: string, id: string) {
  return prisma.ad.findFirst({ where: { id, adSetId, userId } })
}

export async function updateAd(
  userId: string,
  campaignId: string,
  adSetId: string,
  id: string,
  input: UpdateAdInput,
) {
  const ad = await getAdById(userId, adSetId, id)
  if (!ad) return null

  if (input.creativeId !== undefined) {
    const creative = await prisma.adCreative.findFirst({
      where: { id: input.creativeId, adSetId, userId },
    })
    if (!creative) {
      throw new AdValidationError(
        'The referenced creative does not belong to this ad set.',
      )
    }
  }

  const creativeChanged =
    input.creativeId !== undefined && input.creativeId !== ad.creativeId

  const result = await prisma.ad.updateMany({
    where: { id, adSetId, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.creativeId !== undefined && { creativeId: input.creativeId }),
    },
  })

  // Already-published ads can be repointed at a different (already-existing)
  // creative on Meta directly — unlike a creative's own content, which is
  // immutable and needs a brand-new object (see
  // meta-publish.service.ts's syncCreativeEditToMeta).
  if (result.count > 0 && ad.metaAdId && creativeChanged) {
    await syncAdCreativeChangeToMeta(userId, campaignId, adSetId, id)
  }

  return result
}
