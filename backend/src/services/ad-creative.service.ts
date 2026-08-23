import { prisma } from '../db/client.js'
import {
  CreateImagePostCreativeSchema,
  CreateVideoPostCreativeSchema,
  CreateReelsCreativeSchema,
  CreateCarouselCreativeSchema,
  CreateStoryCreativeSchema,
} from '../schemas/ad-creative.schema.js'
import type {
  CreateAdCreativeInput,
  UpdateAdCreativeInput,
} from '../schemas/ad-creative.schema.js'
import { syncCreativeEditToMeta } from './meta-publish.service.js'
import type {
  AdCreativeModel,
  MediaAssetModel,
} from '../generated/prisma/models.js'
import type { Prisma } from '../generated/prisma/client.js'

export class AdCreativeValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdCreativeValidationError'
  }
}

function requireReadyImage(asset: MediaAssetModel | null): string {
  if (!asset || asset.type !== 'IMAGE' || !asset.metaImageHash) {
    throw new AdCreativeValidationError(
      'The referenced media asset is not a ready image — upload it via POST /api/media/images first.',
    )
  }
  return asset.metaImageHash
}

function requireReadyVideo(asset: MediaAssetModel | null): string {
  if (
    !asset ||
    asset.type !== 'VIDEO' ||
    asset.status !== 'READY' ||
    !asset.metaVideoId
  ) {
    throw new AdCreativeValidationError(
      'The referenced media asset is not a ready video — upload it via POST /api/media/videos and wait for processing to finish.',
    )
  }
  return asset.metaVideoId
}

// The "thin abstraction" deliverable: one function that turns our own
// format + copy fields into the exact object_story_spec shape Meta expects,
// so the frontend/AI layer never needs to know Meta's shapes directly. Pure
// function — takes already-resolved media identifiers, not mediaAssetIds.
export function buildObjectStorySpec(
  input: CreateAdCreativeInput,
  resolvedMedia: {
    imageHash?: string
    videoId?: string
    childHashes?: string[]
  },
): Record<string, unknown> {
  const base = {
    page_id: input.pageId,
    ...(input.instagramUserId && { instagram_user_id: input.instagramUserId }),
  }

  switch (input.format) {
    case 'IMAGE_POST':
      return {
        ...base,
        link_data: {
          image_hash: resolvedMedia.imageHash,
          link: input.link,
          message: input.message,
          call_to_action: { type: input.callToActionType },
        },
      }

    case 'VIDEO_POST':
    case 'REELS':
      // Reels ads run through the same video_data object_story_spec as
      // regular video feed posts (Task 3) — placement is what makes an ad a
      // Reels ad, not a distinct spec shape.
      return {
        ...base,
        video_data: {
          video_id: resolvedMedia.videoId,
          ...(input.thumbnailUrl && { image_url: input.thumbnailUrl }),
          ...(input.title && { title: input.title }),
          message: input.message,
          call_to_action: {
            type: input.callToActionType,
            value: { link: input.ctaLink },
          },
        },
      }

    case 'CAROUSEL':
      return {
        ...base,
        link_data: {
          child_attachments: input.childAttachments.map((card, i) => ({
            link: card.link,
            image_hash: resolvedMedia.childHashes?.[i],
            name: card.name,
            ...(card.description && { description: card.description }),
          })),
          multi_share_optimized: true,
          call_to_action: { type: input.callToActionType },
        },
      }

    case 'STORY':
      // Stories reuse link_data/video_data depending on the underlying
      // asset type — placement (facebook_stories/instagram_stories) is what
      // makes it a story, not a distinct spec.
      if (input.mediaType === 'VIDEO') {
        return {
          ...base,
          video_data: {
            video_id: resolvedMedia.videoId,
            ...(input.message && { message: input.message }),
            ...(input.callToActionType &&
              input.ctaLink && {
                call_to_action: {
                  type: input.callToActionType,
                  value: { link: input.ctaLink },
                },
              }),
          },
        }
      }
      return {
        ...base,
        link_data: {
          image_hash: resolvedMedia.imageHash,
          ...(input.link && { link: input.link }),
          ...(input.message && { message: input.message }),
          ...(input.callToActionType && {
            call_to_action: { type: input.callToActionType },
          }),
        },
      }

    default: {
      const exhaustiveCheck: never = input
      throw new AdCreativeValidationError(
        `Unsupported creative format: ${JSON.stringify(exhaustiveCheck)}`,
      )
    }
  }
}

async function resolveMedia(
  userId: string,
  input: CreateAdCreativeInput,
): Promise<{ imageHash?: string; videoId?: string; childHashes?: string[] }> {
  switch (input.format) {
    case 'IMAGE_POST': {
      const asset = await prisma.mediaAsset.findFirst({
        where: { id: input.mediaAssetId, userId },
      })
      return { imageHash: requireReadyImage(asset) }
    }
    case 'VIDEO_POST':
    case 'REELS': {
      const asset = await prisma.mediaAsset.findFirst({
        where: { id: input.mediaAssetId, userId },
      })
      return { videoId: requireReadyVideo(asset) }
    }
    case 'CAROUSEL': {
      const assets = await prisma.mediaAsset.findMany({
        where: {
          id: { in: input.childAttachments.map((c) => c.mediaAssetId) },
          userId,
        },
      })
      const byId = new Map(assets.map((a) => [a.id, a]))
      const childHashes = input.childAttachments.map((card) =>
        requireReadyImage(byId.get(card.mediaAssetId) ?? null),
      )
      return { childHashes }
    }
    case 'STORY': {
      const asset = await prisma.mediaAsset.findFirst({
        where: { id: input.mediaAssetId, userId },
      })
      return input.mediaType === 'VIDEO'
        ? { videoId: requireReadyVideo(asset) }
        : { imageHash: requireReadyImage(asset) }
    }
    default: {
      const exhaustiveCheck: never = input
      throw new AdCreativeValidationError(
        `Unsupported creative format: ${JSON.stringify(exhaustiveCheck)}`,
      )
    }
  }
}

export function listAdCreatives(userId: string, adSetId: string) {
  return prisma.adCreative.findMany({
    where: { adSetId, userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createAdCreative(
  userId: string,
  campaignId: string,
  adSetId: string,
  input: CreateAdCreativeInput,
) {
  const adSet = await prisma.adSet.findFirst({
    where: { id: adSetId, campaignId, userId },
  })
  if (!adSet) return null

  const resolvedMedia = await resolveMedia(userId, input)
  const objectStorySpec = buildObjectStorySpec(input, resolvedMedia)

  return prisma.adCreative.create({
    data: {
      adSetId,
      userId,
      name: input.name,
      format: input.format,
      pageId: input.pageId,
      instagramUserId: input.instagramUserId,
      objectStorySpec: objectStorySpec as Prisma.InputJsonValue,
    },
  })
}

export function getAdCreativeById(
  userId: string,
  campaignId: string,
  adSetId: string,
  id: string,
) {
  return prisma.adCreative.findFirst({
    where: { id, adSetId, userId, adSet: { campaignId } },
  })
}

interface StoredObjectStorySpec {
  link_data?: {
    image_hash?: string
    link?: string
    message?: string
    call_to_action?: { type?: string }
    child_attachments?: {
      link?: string
      image_hash?: string
      name?: string
      description?: string
    }[]
  }
  video_data?: {
    video_id?: string
    image_url?: string
    title?: string
    message?: string
    call_to_action?: { type?: string; value?: { link?: string } }
  }
}

async function mediaRefFromImageHash(userId: string, hash: string | undefined) {
  if (!hash) return {}
  const asset = await prisma.mediaAsset.findFirst({
    where: { metaImageHash: hash, userId },
  })
  if (!asset) return {}
  return {
    mediaAssetId: asset.id,
    ...(asset.sourceUrl && { mediaAssetUrl: asset.sourceUrl }),
  }
}

async function mediaRefFromVideoId(
  userId: string,
  videoId: string | undefined,
) {
  if (!videoId) return {}
  const asset = await prisma.mediaAsset.findFirst({
    where: { metaVideoId: videoId, userId },
  })
  if (!asset) return {}
  return {
    mediaAssetId: asset.id,
    ...(asset.sourceUrl && { mediaAssetUrl: asset.sourceUrl }),
  }
}

// Reverse of buildObjectStorySpec — reads a stored objectStorySpec back into
// our own field names (message/link/callToActionType/mediaAssetId/...) for
// display and edit-prefill. image_hash/video_id are resolved back to a local
// MediaAsset id (+ its sourceUrl for a display thumbnail) via a
// userId-scoped lookup — exact for video (Meta's video id is unique per
// upload) and functionally exact for images (same hash means byte-identical
// image content). CAROUSEL creatives never had a top-level message stored
// in the first place (buildObjectStorySpec doesn't write one for that
// format), so none is derived here either — that's a pre-existing gap in
// the create flow, not something introduced by this reverse mapping.
export async function deriveCreativeDetails(
  userId: string,
  creative: AdCreativeModel,
): Promise<Record<string, unknown>> {
  const spec = creative.objectStorySpec as StoredObjectStorySpec

  switch (creative.format) {
    case 'IMAGE_POST': {
      const ld = spec.link_data ?? {}
      return {
        ...(await mediaRefFromImageHash(userId, ld.image_hash)),
        link: ld.link,
        message: ld.message,
        callToActionType: ld.call_to_action?.type,
      }
    }
    case 'VIDEO_POST':
    case 'REELS': {
      const vd = spec.video_data ?? {}
      return {
        ...(await mediaRefFromVideoId(userId, vd.video_id)),
        title: vd.title,
        message: vd.message,
        callToActionType: vd.call_to_action?.type,
        ctaLink: vd.call_to_action?.value?.link,
        thumbnailUrl: vd.image_url,
      }
    }
    case 'CAROUSEL': {
      const ld = spec.link_data ?? {}
      const childAttachments = await Promise.all(
        (ld.child_attachments ?? []).map(async (card) => ({
          ...(await mediaRefFromImageHash(userId, card.image_hash)),
          link: card.link,
          name: card.name,
          description: card.description,
        })),
      )
      return {
        callToActionType: ld.call_to_action?.type,
        childAttachments,
      }
    }
    case 'STORY': {
      if (spec.video_data) {
        const vd = spec.video_data
        return {
          mediaType: 'VIDEO',
          ...(await mediaRefFromVideoId(userId, vd.video_id)),
          message: vd.message,
          callToActionType: vd.call_to_action?.type,
          ctaLink: vd.call_to_action?.value?.link,
        }
      }
      const ld = spec.link_data ?? {}
      return {
        mediaType: 'IMAGE',
        ...(await mediaRefFromImageHash(userId, ld.image_hash)),
        link: ld.link,
        message: ld.message,
        callToActionType: ld.call_to_action?.type,
      }
    }
    default:
      return {}
  }
}

const CREATE_SCHEMA_BY_FORMAT = {
  IMAGE_POST: CreateImagePostCreativeSchema,
  VIDEO_POST: CreateVideoPostCreativeSchema,
  REELS: CreateReelsCreativeSchema,
  CAROUSEL: CreateCarouselCreativeSchema,
  STORY: CreateStoryCreativeSchema,
} as const

// format is deliberately not accepted from the wire (UpdateAdCreativeSchema
// has no format field) — it determines which fields apply and Meta
// creatives are themselves format-locked, so it's immutable here. The
// merged result is re-validated against the matching per-format
// Create*CreativeSchema variant, which keeps a PATCH exactly as strict as a
// POST despite the wire-level schema being a loose flat bag; fields that
// don't apply to this creative's format are silently dropped by that
// re-parse.
export async function updateAdCreative(
  userId: string,
  campaignId: string,
  adSetId: string,
  id: string,
  input: UpdateAdCreativeInput,
) {
  const creative = await getAdCreativeById(userId, campaignId, adSetId, id)
  if (!creative) return null

  const currentDetails = await deriveCreativeDetails(userId, creative)
  const candidate = {
    format: creative.format,
    name: input.name ?? creative.name,
    pageId: input.pageId ?? creative.pageId,
    instagramUserId:
      input.instagramUserId ?? creative.instagramUserId ?? undefined,
    ...currentDetails,
    ...input,
  }

  const schema =
    CREATE_SCHEMA_BY_FORMAT[
      creative.format as keyof typeof CREATE_SCHEMA_BY_FORMAT
    ]
  let validated: CreateAdCreativeInput
  try {
    validated = schema.parse(candidate) as CreateAdCreativeInput
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Invalid creative update.'
    throw new AdCreativeValidationError(message)
  }

  const resolvedMedia = await resolveMedia(userId, validated)
  const objectStorySpec = buildObjectStorySpec(validated, resolvedMedia)

  const result = await prisma.adCreative.updateMany({
    where: { id, adSetId, userId },
    data: {
      name: validated.name,
      pageId: validated.pageId,
      instagramUserId: validated.instagramUserId,
      objectStorySpec: objectStorySpec as Prisma.InputJsonValue,
    },
  })

  // Already-published creatives are immutable on Meta's side — push a
  // replacement object and repoint every live ad rather than trying to
  // patch the old one (see meta-publish.service.ts's syncCreativeEditToMeta
  // for why).
  if (result.count > 0 && creative.metaCreativeId) {
    await syncCreativeEditToMeta(userId, campaignId, adSetId, id)
  }

  return result
}
