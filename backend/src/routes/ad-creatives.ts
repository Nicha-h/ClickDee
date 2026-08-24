import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  AdCreativeSchema,
  CreateAdCreativeSchema,
  UpdateAdCreativeSchema,
  AdSetScopedParamSchema,
  AdCreativeIdParamSchema,
} from '../schemas/ad-creative.schema.js'
import * as adCreativeService from '../services/ad-creative.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { AdCreativeModel } from '../generated/prisma/models.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

async function serializeAdCreative(userId: string, creative: AdCreativeModel) {
  return {
    id: creative.id,
    adSetId: creative.adSetId,
    name: creative.name,
    format: creative.format,
    pageId: creative.pageId,
    instagramUserId: creative.instagramUserId,
    aiGenerated: creative.aiGenerated,
    aiDisclosureLabel: creative.aiDisclosureLabel,
    objectStorySpec: creative.objectStorySpec as Record<string, unknown>,
    creativeDetails: await adCreativeService.deriveCreativeDetails(
      userId,
      creative,
    ),
    metaCreativeId: creative.metaCreativeId,
    metaReviewFeedback: creative.metaReviewFeedback,
    createdAt: creative.createdAt.toISOString(),
    updatedAt: creative.updatedAt.toISOString(),
  }
}

export const adCreativesApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const listAdCreativesRoute = createRoute({
  method: 'get',
  path: '/{campaignId}/ad-sets/{adSetId}/creatives',
  tags: ['AdCreatives'],
  middleware: [requireAuth] as const,
  request: { params: AdSetScopedParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: z.array(AdCreativeSchema) } },
      description: "List an ad set's creatives",
    },
  },
})
adCreativesApp.openapi(listAdCreativesRoute, async (c) => {
  const userId = c.get('userId')
  const { adSetId } = c.req.valid('param')
  const creatives = await adCreativeService.listAdCreatives(userId, adSetId)
  return c.json(
    await Promise.all(
      creatives.map((creative) => serializeAdCreative(userId, creative)),
    ),
    200,
  )
})

const getAdCreativeRoute = createRoute({
  method: 'get',
  path: '/{campaignId}/ad-sets/{adSetId}/creatives/{id}',
  tags: ['AdCreatives'],
  middleware: [requireAuth] as const,
  request: { params: AdCreativeIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: AdCreativeSchema } },
      description: 'Retrieve an ad creative by id',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad creative not found',
    },
  },
})
adCreativesApp.openapi(getAdCreativeRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, adSetId, id } = c.req.valid('param')
  const creative = await adCreativeService.getAdCreativeById(
    userId,
    campaignId,
    adSetId,
    id,
  )
  if (!creative) return c.json({ message: 'Ad creative not found' }, 404)
  return c.json(await serializeAdCreative(userId, creative), 200)
})

const createAdCreativeRoute = createRoute({
  method: 'post',
  path: '/{campaignId}/ad-sets/{adSetId}/creatives',
  tags: ['AdCreatives'],
  middleware: [requireAuth] as const,
  request: {
    params: AdSetScopedParamSchema,
    body: {
      content: { 'application/json': { schema: CreateAdCreativeSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: AdCreativeSchema } },
      description: 'Ad creative created',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad set not found',
    },
  },
})
adCreativesApp.openapi(createAdCreativeRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, adSetId } = c.req.valid('param')
  const input = c.req.valid('json')
  const creative = await adCreativeService.createAdCreative(
    userId,
    campaignId,
    adSetId,
    input,
  )
  if (!creative) return c.json({ message: 'Ad set not found' }, 404)
  return c.json(await serializeAdCreative(userId, creative), 201)
})

const updateAdCreativeRoute = createRoute({
  method: 'patch',
  path: '/{campaignId}/ad-sets/{adSetId}/creatives/{id}',
  tags: ['AdCreatives'],
  middleware: [requireAuth] as const,
  request: {
    params: AdCreativeIdParamSchema,
    body: {
      content: { 'application/json': { schema: UpdateAdCreativeSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AdCreativeSchema } },
      description: 'Ad creative updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad creative not found',
    },
  },
})
adCreativesApp.openapi(updateAdCreativeRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, adSetId, id } = c.req.valid('param')
  const input = c.req.valid('json')
  const result = await adCreativeService.updateAdCreative(
    userId,
    campaignId,
    adSetId,
    id,
    input,
  )
  if (!result || result.count === 0) {
    return c.json({ message: 'Ad creative not found' }, 404)
  }
  const creative = await adCreativeService.getAdCreativeById(
    userId,
    campaignId,
    adSetId,
    id,
  )
  return c.json(await serializeAdCreative(userId, creative!), 200)
})

const deleteAdCreativeRoute = createRoute({
  method: 'delete',
  path: '/{campaignId}/ad-sets/{adSetId}/creatives/{id}',
  tags: ['AdCreatives'],
  middleware: [requireAuth] as const,
  request: { params: AdCreativeIdParamSchema },
  responses: {
    204: { description: 'Ad creative deleted' },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Ad creative not found',
    },
  },
})
adCreativesApp.openapi(deleteAdCreativeRoute, async (c) => {
  const userId = c.get('userId')
  const { campaignId, adSetId, id } = c.req.valid('param')
  const deleted = await adCreativeService.deleteAdCreative(
    userId,
    campaignId,
    adSetId,
    id,
  )
  if (!deleted) return c.json({ message: 'Ad creative not found' }, 404)
  return c.body(null, 204)
})
