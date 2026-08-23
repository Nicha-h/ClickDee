import { OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import * as mediaService from '../services/media.service.js'
import { requireAuth, type AuthVariables } from '../middleware/auth.js'
import type { MediaAssetModel } from '../generated/prisma/models.js'

function serializeMediaAsset(asset: MediaAssetModel) {
  return {
    id: asset.id,
    type: asset.type,
    status: asset.status,
    metaImageHash: asset.metaImageHash,
    metaVideoId: asset.metaVideoId,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }
}

// Plain (non-openapi-validated) routes for multipart file upload — the
// @hono/zod-openapi multipart/form-data + File typing adds complexity this
// upload path doesn't need; OpenAPIHono is still a Hono subclass, so plain
// .post()/.get() work identically, they just won't show up in the generated
// OpenAPI spec.
export const mediaApp = new OpenAPIHono<{ Variables: AuthVariables }>()

async function readUploadedFile(c: Context<{ Variables: AuthVariables }>) {
  const body = await c.req.parseBody()
  const file = body['file']
  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: 'A "file" field is required.' })
  }
  return {
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    fileData: Buffer.from(await file.arrayBuffer()),
  }
}

mediaApp.post('/images', requireAuth, async (c) => {
  const userId = c.get('userId')
  const file = await readUploadedFile(c)
  const asset = await mediaService.uploadImage(userId, file)
  return c.json(serializeMediaAsset(asset), 201)
})

mediaApp.post('/videos', requireAuth, async (c) => {
  const userId = c.get('userId')
  const file = await readUploadedFile(c)
  const asset = await mediaService.uploadVideo(userId, file)
  return c.json(serializeMediaAsset(asset), 201)
})

mediaApp.get('/:id', requireAuth, async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const asset = await mediaService.getMediaAssetById(userId, id)
  if (!asset) return c.json({ message: 'Media asset not found' }, 404)
  return c.json(serializeMediaAsset(asset), 200)
})

// Polls Meta for this video's processing status and updates the stored
// record — call repeatedly until status is READY/FAILED before referencing
// the asset in a creative.
mediaApp.post('/:id/poll', requireAuth, async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const asset = await mediaService.pollVideoStatus(userId, id)
  if (!asset) return c.json({ message: 'Media asset not found' }, 404)
  return c.json(serializeMediaAsset(asset), 200)
})
