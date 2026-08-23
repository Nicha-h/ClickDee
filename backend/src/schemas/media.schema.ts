import { z } from '@hono/zod-openapi'

export const MediaAssetTypeEnum = z.enum(['IMAGE', 'VIDEO'])
export const MediaAssetStatusEnum = z.enum(['PENDING', 'READY', 'FAILED'])

export const MediaAssetSchema = z
  .object({
    id: z.string(),
    type: MediaAssetTypeEnum,
    status: MediaAssetStatusEnum,
    metaImageHash: z.string().nullable(),
    metaVideoId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('MediaAsset')

export const MediaAssetIdParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})
