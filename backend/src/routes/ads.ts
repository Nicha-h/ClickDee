import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AdSchema,
  CreateAdSchema,
  UpdateAdSchema,
  AdSetScopedParamSchema,
  AdIdParamSchema,
} from '../schemas/ad.schema.js'
import * as adService from '../services/ad.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { AdModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

function serializeAd(ad: AdModel) {
  return {
    id: ad.id,
    adSetId: ad.adSetId,
    creativeId: ad.creativeId,
    name: ad.name,
    metaAdId: ad.metaAdId,
    metaStatus: ad.metaStatus,
    metaEffectiveStatus: ad.metaEffectiveStatus,
    metaReviewFeedback: ad.metaReviewFeedback,
    createdAt: ad.createdAt.toISOString(),
    updatedAt: ad.updatedAt.toISOString(),
  }
}

export const adsApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listAdsRoute = createRoute({
  method: 'get',
  path: '/{campaignId}/ad-sets/{adSetId}/ads',
  tags: ['Ads'],
  middleware: [requireAuth] as const,
  request: { params: AdSetScopedParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AdSchema) } },
      description: "List an ad set's ads",
    },
  },
})
adsApp.openapi(listAdsRoute, async (c) => {
  const userId = c.get('userId')
  const { adSetId } = c.req.valid('param')
  const ads = await adService.listAds(userId, adSetId)
  return c.json(ads.map(serializeAd), 200)
})

const createAdRoute = createRoute({
  method: 'post',
  path: '/{campaignId}/ad-sets/{adSetId}/ads',
  tags: ['Ads'],
  middleware: [requireAuth] as const,
  request: {
    params: AdSetScopedParamSchema,
    body: { content: { 'application/json': { schema: CreateAdSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AdSchema } },
      description: 'Ad created',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad set or creative not found',
    },
  },
})
adsApp.openapi(createAdRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, adSetId } = c.req.valid('param')
  const input = c.req.valid('json')
  const ad = await adService.createAd(userId, campaignId, adSetId, input)
  if (!ad) return c.json({ message: 'Ad set or creative not found' }, 404)
  return c.json(serializeAd(ad), 201)
})

const getAdRoute = createRoute({
  method: 'get',
  path: '/{campaignId}/ad-sets/{adSetId}/ads/{id}',
  tags: ['Ads'],
  middleware: [requireAuth] as const,
  request: { params: AdIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AdSchema } },
      description: 'Retrieve an ad by id',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad not found',
    },
  },
})
adsApp.openapi(getAdRoute, async (c) => {
  const userId = c.get('userId')
  const { adSetId, id } = c.req.valid('param')
  const ad = await adService.getAdById(userId, adSetId, id)
  if (!ad) return c.json({ message: 'Ad not found' }, 404)
  return c.json(serializeAd(ad), 200)
})

const updateAdRoute = createRoute({
  method: 'patch',
  path: '/{campaignId}/ad-sets/{adSetId}/ads/{id}',
  tags: ['Ads'],
  middleware: [requireAuth] as const,
  request: {
    params: AdIdParamSchema,
    body: { content: { 'application/json': { schema: UpdateAdSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdSchema } },
      description: 'Ad updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad not found',
    },
  },
})
adsApp.openapi(updateAdRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, adSetId, id } = c.req.valid('param')
  const input = c.req.valid('json')
  const result = await adService.updateAd(
    userId,
    campaignId,
    adSetId,
    id,
    input,
  )
  if (!result || result.count === 0) {
    return c.json({ message: 'Ad not found' }, 404)
  }
  const ad = await adService.getAdById(userId, adSetId, id)
  return c.json(serializeAd(ad!), 200)
})
