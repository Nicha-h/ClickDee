import { prisma } from '../db/client.js'
import type {
  CreateAdSetInput,
  UpdateAdSetInput,
} from '../schemas/ad-set.schema.js'

const OBJECTIVES_REQUIRING_PROMOTED_OBJECT = new Set([
  'OUTCOME_APP_PROMOTION',
  'OUTCOME_LEADS',
])

export class AdSetValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdSetValidationError'
  }
}

// Task 2's conditionally-required fields depend on the parent Campaign's
// objective, which this ad set's own schema can't see — checked here,
// against the already-loaded campaign row, rather than in ad-set.schema.ts.
function validatePromotedObject(
  objective: string | null,
  input: Pick<CreateAdSetInput, 'promotedObject' | 'destinationType'>,
) {
  if (!objective || !OBJECTIVES_REQUIRING_PROMOTED_OBJECT.has(objective)) {
    return
  }
  if (!input.promotedObject) {
    throw new AdSetValidationError(
      `A promoted object (e.g. app id or page id) is required for ad sets under a "${objective}" campaign.`,
    )
  }
  if (!input.destinationType) {
    throw new AdSetValidationError(
      `A destination type is required for ad sets under a "${objective}" campaign.`,
    )
  }
}

export function listAdSets(userId: string, campaignId: string) {
  return prisma.adSet.findMany({
    where: { campaignId, userId },
    orderBy: { createdAt: 'desc' },
  })
}

export function getAdSetById(userId: string, campaignId: string, id: string) {
  return prisma.adSet.findFirst({ where: { id, campaignId, userId } })
}

export async function createAdSet(
  userId: string,
  campaignId: string,
  input: CreateAdSetInput,
) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })
  if (!campaign) return null

  validatePromotedObject(campaign.objective, input)

  return prisma.adSet.create({
    data: {
      campaignId,
      userId,
      name: input.name,
      optimizationGoal: input.optimizationGoal,
      billingEvent: input.billingEvent,
      targeting: input.targeting,
      dailyBudget: input.dailyBudget,
      lifetimeBudget: input.lifetimeBudget,
      bidAmount: input.bidAmount,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      promotedObject: input.promotedObject,
      destinationType: input.destinationType,
      dsaBeneficiary: input.dsaBeneficiary,
      advantagePlacements: input.advantagePlacements,
    },
  })
}

export async function deleteAdSet(userId: string, campaignId: string, id: string) {
  const result = await prisma.adSet.deleteMany({
    where: { id, campaignId, userId },
  })
  return result.count > 0
}

export async function updateAdSet(
  userId: string,
  campaignId: string,
  id: string,
  input: UpdateAdSetInput,
) {
  return prisma.adSet.updateMany({
    where: { id, campaignId, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.optimizationGoal !== undefined && {
        optimizationGoal: input.optimizationGoal,
      }),
      ...(input.billingEvent !== undefined && {
        billingEvent: input.billingEvent,
      }),
      ...(input.targeting !== undefined && { targeting: input.targeting }),
      ...(input.dailyBudget !== undefined && {
        dailyBudget: input.dailyBudget,
      }),
      ...(input.lifetimeBudget !== undefined && {
        lifetimeBudget: input.lifetimeBudget,
      }),
      ...(input.bidAmount !== undefined && { bidAmount: input.bidAmount }),
      ...(input.startTime !== undefined && {
        startTime: new Date(input.startTime),
      }),
      ...(input.endTime !== undefined && { endTime: new Date(input.endTime) }),
      ...(input.promotedObject !== undefined && {
        promotedObject: input.promotedObject,
      }),
      ...(input.destinationType !== undefined && {
        destinationType: input.destinationType,
      }),
      ...(input.dsaBeneficiary !== undefined && {
        dsaBeneficiary: input.dsaBeneficiary,
      }),
      ...(input.advantagePlacements !== undefined && {
        advantagePlacements: input.advantagePlacements,
      }),
    },
  })
}
