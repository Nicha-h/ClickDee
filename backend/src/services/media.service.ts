import { randomUUID } from 'node:crypto'
import { prisma } from '../db/client.js'
import { metaUploadFile, metaRequest } from '../lib/meta-client.js'
import { env } from '../config/env.js'
import {
  getDevMetaCredentials,
  MetaNotConfiguredError,
} from '../config/meta.js'
import { uploadBufferToCloudinary } from '../lib/cloudinary-client.js'

// Demo/offline escape hatch (env.META_SIMULATE_PUBLISH) — see config/env.ts
// and meta-publish.service.ts's identical helper.
function simulatedMetaId(prefix: string) {
  return `sim_${prefix}_${randomUUID()}`
}

interface UploadFileInput {
  fileName: string
  contentType: string
  fileData: Buffer
}

// Best-effort: Cloudinary is a preview-hosting concern only, never a
// requirement for actually publishing an ad (Meta's own hash/id is). Runs
// unconditionally — including under env.META_SIMULATE_PUBLISH, which exists
// solely to work around Meta's Development-mode restriction and has no
// bearing on whether Cloudinary hosting should also happen. A failure here
// is logged and swallowed so it never blocks the Meta upload that follows.
async function tryUploadToCloudinary(
  assetId: string,
  resourceType: 'image' | 'video',
  file: UploadFileInput,
) {
  try {
    return await uploadBufferToCloudinary({
      buffer: file.fileData,
      publicId: assetId,
      resourceType,
      folder: `clickdee/${env.NODE_ENV}`,
    })
  } catch (err) {
    console.error('Cloudinary upload failed (non-fatal):', err)
    return null
  }
}

// Single seam deciding "which URL do we show for this asset" now that two
// independent providers can each supply one: Cloudinary's (reliable, set for
// every upload — image/video, real/simulated) takes precedence over Meta's
// own returned image URL (image-only, real-upload-only).
export function resolveMediaAssetPreviewUrl(asset: {
  cloudinaryUrl: string | null
  sourceUrl: string | null
}): string | null {
  return asset.cloudinaryUrl ?? asset.sourceUrl
}

interface AdImagesResponse {
  images: Record<string, { hash: string; url?: string }>
}

// Images must be uploaded first, then referenced by hash in the creative
// call — never sent as raw bytes in the creative payload itself.
export async function uploadImage(userId: string, file: UploadFileInput) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const asset = await prisma.mediaAsset.create({
    data: { userId, type: 'IMAGE', status: 'PENDING' },
  })

  const cloudinaryResult = await tryUploadToCloudinary(asset.id, 'image', file)
  const cloudinaryFields = cloudinaryResult
    ? {
        cloudinaryUrl: cloudinaryResult.secureUrl,
        cloudinaryPublicId: cloudinaryResult.publicId,
      }
    : {}

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        status: 'READY',
        metaImageHash: simulatedMetaId('image'),
        ...cloudinaryFields,
      },
    })
  }

  try {
    const result = await metaUploadFile<AdImagesResponse>(
      `act_${credentials.adAccountId}/adimages`,
      {
        accessToken: credentials.accessToken,
        fileFieldName: 'source',
        fileName: file.fileName,
        fileContentType: file.contentType,
        fileData: file.fileData,
      },
    )
    const entry = Object.values(result.images)[0]
    return prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        status: 'READY',
        metaImageHash: entry.hash,
        sourceUrl: entry.url,
        ...cloudinaryFields,
      },
    })
  } catch (err) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'FAILED', ...cloudinaryFields },
    })
    throw err
  }
}

interface AdVideosUploadResponse {
  id: string
}

// Video processing is async — this only kicks off the upload and records
// the returned video_id; callers must poll pollVideoStatus before
// referencing the video in a creative.
export async function uploadVideo(userId: string, file: UploadFileInput) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const asset = await prisma.mediaAsset.create({
    data: { userId, type: 'VIDEO', status: 'PENDING' },
  })

  const cloudinaryResult = await tryUploadToCloudinary(asset.id, 'video', file)
  const cloudinaryFields = cloudinaryResult
    ? {
        cloudinaryUrl: cloudinaryResult.secureUrl,
        cloudinaryPublicId: cloudinaryResult.publicId,
      }
    : {}

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        status: 'READY',
        metaVideoId: simulatedMetaId('video'),
        ...cloudinaryFields,
      },
    })
  }

  try {
    const result = await metaUploadFile<AdVideosUploadResponse>(
      `act_${credentials.adAccountId}/advideos`,
      {
        accessToken: credentials.accessToken,
        fileFieldName: 'source',
        fileName: file.fileName,
        fileContentType: file.contentType,
        fileData: file.fileData,
        video: true,
      },
    )
    return prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { metaVideoId: result.id, ...cloudinaryFields },
    })
  } catch (err) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'FAILED', ...cloudinaryFields },
    })
    throw err
  }
}

interface VideoStatusResponse {
  status: { video_status: 'ready' | 'processing' | 'error' }
}

// Polls Meta once and updates the stored status accordingly — callers (a
// route handler, or a future background poller) decide the retry cadence.
export async function pollVideoStatus(userId: string, mediaAssetId: string) {
  const credentials = getDevMetaCredentials()
  if (!credentials) throw new MetaNotConfiguredError()

  const asset = await prisma.mediaAsset.findFirst({
    where: { id: mediaAssetId, userId, type: 'VIDEO' },
  })
  if (!asset || !asset.metaVideoId) return asset

  // Simulated uploads are already READY (see uploadVideo above) — nothing to poll.
  if (env.META_SIMULATE_PUBLISH) return asset

  const result = await metaRequest<VideoStatusResponse>(asset.metaVideoId, {
    accessToken: credentials.accessToken,
    params: { fields: 'status' },
  })

  const status =
    result.status.video_status === 'ready'
      ? 'READY'
      : result.status.video_status === 'error'
        ? 'FAILED'
        : 'PENDING'

  return prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { status },
  })
}

export function getMediaAssetById(userId: string, id: string) {
  return prisma.mediaAsset.findFirst({ where: { id, userId } })
}
