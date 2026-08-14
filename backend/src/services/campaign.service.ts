import { prisma } from '../db/client.js'
import type { CreateCampaignInput } from '../schemas/campaign.schema.js'

export function listCampaigns() {
  return prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
}

export function getCampaignById(id: string) {
  return prisma.campaign.findUnique({ where: { id } })
}

export function createCampaign(input: CreateCampaignInput) {
  return prisma.campaign.create({
    data: {
      name: input.name,
      status: input.status,
      budget: input.budget,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    },
  })
}
