import { prisma } from '../db/client.js'
import type {
  CreateCampaignInput,
  UpdateCampaignInput,
} from '../schemas/campaign.schema.js'

export function listCampaigns(userId: string) {
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export function getCampaignById(userId: string, id: string) {
  return prisma.campaign.findFirst({ where: { id, userId } })
}

export function createCampaign(userId: string, input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      userId,
      name: input.name,
      caption: input.caption,
      status: input.status,
      budget: input.budget,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  })
}

export function updateCampaign(
  userId: string,
  id: string,
  input: UpdateCampaignInput,
) {
  return prisma.campaign.updateMany({
    where: { id, userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.caption !== undefined && { caption: input.caption }),
      ...(input.budget !== undefined && { budget: input.budget }),
      ...(input.startDate !== undefined && {
        startDate: new Date(input.startDate),
      }),
      ...(input.endDate !== undefined && {
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
      ...(input.status !== undefined && { status: input.status }),
    },
  })
}

export async function deleteCampaign(userId: string, id: string) {
  const result = await prisma.campaign.deleteMany({ where: { id, userId } })
  return result.count > 0
}
