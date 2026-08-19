import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  CampaignSchema,
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CampaignIdParamSchema,
} from '../schemas/campaign.schema.js'
import * as campaignService from '../services/campaign.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { CampaignModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeCampaign(campaign: CampaignModel) {
  return {
    id: campaign.id,
    name: campaign.name,
    caption: campaign.caption,
    status: campaign.status,
    budget: campaign.budget.toString(),
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  }
}

export const campaignsApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listCampaignsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Campaigns'],
  middleware: [requireAuth] as const,
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(CampaignSchema) } },
      description: "List the caller's campaigns",
    },
  },
})
campaignsApp.openapi(listCampaignsRoute, async (c) => {
  const userId = c.get('userId')
  const campaigns = await campaignService.listCampaigns(userId)
  return c.json(campaigns.map(serializeCampaign), 200)
})

const getCampaignRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Campaigns'],
  middleware: [requireAuth] as const,
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
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  // Scoping the lookup by userId means "doesn't exist" and "exists but
  // isn't yours" both fall through to the same 404 — no separate ownership
  // check needed, and it doesn't leak whether a given id exists at all.
  const campaign = await campaignService.getCampaignById(userId, id)
  if (!campaign) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  return c.json(serializeCampaign(campaign), 200)
})

const createCampaignRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Campaigns'],
  middleware: [requireAuth] as const,
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
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const campaign = await campaignService.createCampaign(userId, input)
  return c.json(serializeCampaign(campaign), 201)
})

const updateCampaignRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Campaigns'],
  middleware: [requireAuth] as const,
  request: {
    params: CampaignIdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateCampaignSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: CampaignSchema } },
      description: 'Campaign updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
campaignsApp.openapi(updateCampaignRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const input = c.req.valid('json')
  const result = await campaignService.updateCampaign(userId, id, input)
  if (result.count === 0) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  const campaign = await campaignService.getCampaignById(userId, id)
  return c.json(serializeCampaign(campaign!), 200)
})

const deleteCampaignRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Campaigns'],
  middleware: [requireAuth] as const,
  request: { params: CampaignIdParamSchema },
  responses: {
    204: { description: 'Campaign deleted' },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
campaignsApp.openapi(deleteCampaignRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const deleted = await campaignService.deleteCampaign(userId, id)
  if (!deleted) {
    return c.json({ message: 'Campaign not found' }, 404)
  }
  return c.body(null, 204)
})
