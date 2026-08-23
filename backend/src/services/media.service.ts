import { randomUUID } from 'node:crypto'
import { prisma } from '../db/client.js'
import { metaUploadFile, metaRequest } from '../lib/meta-client.js'
import { env } from '../config/env.js'
import {
  getDevMetaCredentials,
  MetaNotConfiguredError,
} from '../config/meta.js'

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

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'READY', metaImageHash: simulatedMetaId('image') },
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
      },
    })
  } catch (err) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'FAILED' },
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

  if (env.META_SIMULATE_PUBLISH) {
    return prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'READY', metaVideoId: simulatedMetaId('video') },
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
      data: { metaVideoId: result.id },
    })
  } catch (err) {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'FAILED' },
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
