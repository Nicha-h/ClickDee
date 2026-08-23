import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import {
  CampaignIdParamSchema,
  SetMetaStatusSchema,
  PublishToMetaResponseSchema,
  SetMetaStatusResponseSchema,
} from '../schemas/meta-publish.schema.js'
import * as metaPublishService from '../services/meta-publish.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'

const ErrorSchema = z.object({ message: z.string() }).openapi('Error')

export const metaPublishApp = new OpenAPIHono<{ Variables: AuthVariables }>()

const publishToMetaRoute = createRoute({
  method: 'post',
  path: '/{id}/publish-to-meta',
  tags: ['MetaPublish'],
  middleware: [requireAuth] as const,
  request: { params: CampaignIdParamSchema },
  responses: {
    200: {
      content: { 'application/json': { schema: PublishToMetaResponseSchema } },
      description:
        'Pushes the local campaign/ad-set/creative/ad hierarchy to Meta, everything created PAUSED',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
metaPublishApp.openapi(publishToMetaRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const result = await metaPublishService.publishCampaignToMeta(userId, id)
  if (!result) return c.json({ message: 'Campaign not found' }, 404)
  return c.json(result, 200)
})

const setMetaStatusRoute = createRoute({
  method: 'post',
  path: '/{id}/meta-status',
  tags: ['MetaPublish'],
  middleware: [requireAuth] as const,
  request: {
    params: CampaignIdParamSchema,
    body: { content: { 'application/json': { schema: SetMetaStatusSchema } } },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: SetMetaStatusResponseSchema } },
      description:
        'The only endpoint that can set ACTIVE on Meta — cascades to child ad sets/ads',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Campaign not found',
    },
  },
})
metaPublishApp.openapi(setMetaStatusRoute, async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')
  const result = await metaPublishService.setMetaStatus(userId, id, status)
  if (!result) return c.json({ message: 'Campaign not found' }, 404)
  return c.json(result, 200)
})
