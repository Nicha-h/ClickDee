import { prisma } from '../db/client.js'
import type { CreateCampaignInput } from '../schemas/campaign.schema.js'

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
      status: input.status,
      budget: input.budget,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  })
}
