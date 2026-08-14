import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  CampaignSchema,
  CreateCampaignSchema,
  CampaignIdParamSchema,
} from '../schemas/campaign.schema.js'
import * as campaignService from '../services/campaign.service.js'
import type { CampaignModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeCampaign(campaign: CampaignModel) {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    budget: campaign.budget.toString(),
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  }
}

export const campaignsApp = new OpenAPIHono()

const listCampaignsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Campaigns'],
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(CampaignSchema) } },
      description: 'List all campaigns',
    },
  },
})
campaignsApp.openapi(listCampaignsRoute, async (c) => {
  const campaigns = await campaignService.listCampaigns()
  return c.json(campaigns.map(serializeCampaign), 200)
})

const getCampaignRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Campaigns'],
  request: { params: CampaignIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: CampaignSchema } },
      description: 'Retrieve a campaign by id',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
campaignsApp.openapi(getCampaignRoute, async (c) => {
  const { id } = c.req.valid('param')
  const campaign = await campaignService.getCampaignById(id)
  if (!campaign) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  return c.json(serializeCampaign(campaign), 200)
})

const createCampaignRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Campaigns'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateCampaignSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: CampaignSchema } },
      description: 'Campaign created',
    },
  },
})
campaignsApp.openapi(createCampaignRoute, async (c) => {
  const input = c.req.valid('json')
  const campaign = await campaignService.createCampaign(input)
  return c.json(serializeCampaign(campaign), 201)
})
