import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AdSetSchema,
  CreateAdSetSchema,
  UpdateAdSetSchema,
  AdSetIdParamSchema,
  CampaignIdParamSchema,
} from '../schemas/ad-set.schema.js'
import * as adSetService from '../services/ad-set.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { AdSetModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeAdSet(adSet: AdSetModel) {
  return {
    id: adSet.id,
    campaignId: adSet.campaignId,
    name: adSet.name,
    optimizationGoal: adSet.optimizationGoal,
    billingEvent: adSet.billingEvent,
    destinationType: adSet.destinationType,
    dsaBeneficiary: adSet.dsaBeneficiary,
    targeting: adSet.targeting as Record<string, unknown>,
    dailyBudget: adSet.dailyBudget,
    lifetimeBudget: adSet.lifetimeBudget,
    bidAmount: adSet.bidAmount,
    startTime: adSet.startTime ? adSet.startTime.toISOString() : null,
    endTime: adSet.endTime ? adSet.endTime.toISOString() : null,
    promotedObject: adSet.promotedObject as Record<string, unknown> | null,
    advantagePlacements: adSet.advantagePlacements,
    metaAdSetId: adSet.metaAdSetId,
    metaStatus: adSet.metaStatus,
    metaEffectiveStatus: adSet.metaEffectiveStatus,
    metaReviewFeedback: adSet.metaReviewFeedback,
    createdAt: adSet.createdAt.toISOString(),
    updatedAt: adSet.updatedAt.toISOString(),
  }
}

export const adSetsApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listAdSetsRoute = createRoute({
  method: 'get',
  path: '/{campaignId}/ad-sets',
  tags: ['AdSets'],
  middleware: [requireAuth] as const,
  request: { params: CampaignIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AdSetSchema) } },
      description: "List a campaign's ad sets",
    },
  },
})
adSetsApp.openapi(listAdSetsRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId } = c.req.valid('param')
  const adSets = await adSetService.listAdSets(userId, campaignId)
  return c.json(adSets.map(serializeAdSet), 200)
})

const getAdSetRoute = createRoute({
  method: 'get',
  path: '/{campaignId}/ad-sets/{id}',
  tags: ['AdSets'],
  middleware: [requireAuth] as const,
  request: { params: AdSetIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AdSetSchema } },
      description: 'Retrieve an ad set by id',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad set not found',
    },
  },
})
adSetsApp.openapi(getAdSetRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, id } = c.req.valid('param')
  const adSet = await adSetService.getAdSetById(userId, campaignId, id)
  if (!adSet) return c.json({ message: 'Ad set not found' }, 404)
  return c.json(serializeAdSet(adSet), 200)
})

const createAdSetRoute = createRoute({
  method: 'post',
  path: '/{campaignId}/ad-sets',
  tags: ['AdSets'],
  middleware: [requireAuth] as const,
  request: {
    params: CampaignIdParamSchema,
    body: { content: { 'application/json': { schema: CreateAdSetSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AdSetSchema } },
      description: 'Ad set created',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
adSetsApp.openapi(createAdSetRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId } = c.req.valid('param')
  const input = c.req.valid('json')
  const adSet = await adSetService.createAdSet(userId, campaignId, input)
  if (!adSet) return c.json({ message: 'Campaign not found' }, 404)
  return c.json(serializeAdSet(adSet), 201)
})

const updateAdSetRoute = createRoute({
  method: 'patch',
  path: '/{campaignId}/ad-sets/{id}',
  tags: ['AdSets'],
  middleware: [requireAuth] as const,
  request: {
    params: AdSetIdParamSchema,
    body: { content: { 'application/json': { schema: UpdateAdSetSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdSetSchema } },
      description: 'Ad set updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad set not found',
    },
  },
})
adSetsApp.openapi(updateAdSetRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, id } = c.req.valid('param')
  const input = c.req.valid('json')
  const result = await adSetService.updateAdSet(userId, campaignId, id, input)
  if (result.count === 0) return c.json({ message: 'Ad set not found' }, 404)
  const adSet = await adSetService.getAdSetById(userId, campaignId, id)
  return c.json(serializeAdSet(adSet!), 200)
})
