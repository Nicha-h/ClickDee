import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    adCreative: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    mediaAsset: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('./meta-publish.service.js', () => ({
  syncCreativeEditToMeta: vi.fn(),
}))

import { prisma } from '../db/client.js'
import { syncCreativeEditToMeta } from './meta-publish.service.js'
import {
  buildObjectStorySpec,
  deriveCreativeDetails,
  updateAdCreative,
  AdCreativeValidationError,
} from './ad-creative.service.js'
import type { AdCreativeModel } from '../generated/prisma/models.js'
import type {
  CreateImagePostCreativeInput,
  CreateVideoPostCreativeInput,
  CreateReelsCreativeInput,
  CreateCarouselCreativeInput,
  CreateStoryCreativeInput,
} from '../schemas/ad-creative.schema.js'

const base = {
  name: 'Test creative',
  pageId: 'page-1',
  instagramUserId: 'ig-1',
}

describe('buildObjectStorySpec', () => {
  it('builds the link_data shape for IMAGE_POST', () => {
    const input: CreateImagePostCreativeInput = {
      ...base,
      format: 'IMAGE_POST',
      mediaAssetId: 'media-1',
      link: 'https://example.com',
      message: 'Buy now',
      callToActionType: 'SHOP_NOW',
    }
    const spec = buildObjectStorySpec(input, { imageHash: 'hash-abc' })
    expect(spec).toEqual({
      page_id: 'page-1',
      instagram_user_id: 'ig-1',
      link_data: {
        image_hash: 'hash-abc',
        link: 'https://example.com',
        message: 'Buy now',
        call_to_action: { type: 'SHOP_NOW' },
      },
    })
  })

  it('builds the video_data shape for VIDEO_POST', () => {
    const input: CreateVideoPostCreativeInput = {
      ...base,
      format: 'VIDEO_POST',
      mediaAssetId: 'media-2',
      title: 'Our new product',
      message: 'Watch this',
      callToActionType: 'LEARN_MORE',
      ctaLink: 'https://example.com/product',
    }
    const spec = buildObjectStorySpec(input, { videoId: 'vid-123' })
    expect(spec).toEqual({
      page_id: 'page-1',
      instagram_user_id: 'ig-1',
      video_data: {
        video_id: 'vid-123',
        title: 'Our new product',
        message: 'Watch this',
        call_to_action: {
          type: 'LEARN_MORE',
          value: { link: 'https://example.com/product' },
        },
      },
    })
  })

  it('builds the same video_data shape for REELS as VIDEO_POST (Task 3)', () => {
    const input: CreateReelsCreativeInput = {
      ...base,
      format: 'REELS',
      mediaAssetId: 'media-3',
      message: 'Reels ad',
      callToActionType: 'SHOP_NOW',
      ctaLink: 'https://example.com/reels',
    }
    const spec = buildObjectStorySpec(input, { videoId: 'vid-456' })
    expect(spec).toEqual({
      page_id: 'page-1',
      instagram_user_id: 'ig-1',
      video_data: {
        video_id: 'vid-456',
        message: 'Reels ad',
        call_to_action: {
          type: 'SHOP_NOW',
          value: { link: 'https://example.com/reels' },
        },
      },
    })
  })

  it('builds the link_data child_attachments shape for CAROUSEL', () => {
    const input: CreateCarouselCreativeInput = {
      ...base,
      format: 'CAROUSEL',
      childAttachments: [
        {
          mediaAssetId: 'media-4',
          link: 'https://example.com/1',
          name: 'Card 1',
        },
        {
          mediaAssetId: 'media-5',
          link: 'https://example.com/2',
          name: 'Card 2',
          description: 'Second card',
        },
      ],
      callToActionType: 'SHOP_NOW',
    }
    const spec = buildObjectStorySpec(input, {
      childHashes: ['hash-1', 'hash-2'],
    })
    expect(spec).toEqual({
      page_id: 'page-1',
      instagram_user_id: 'ig-1',
      link_data: {
        child_attachments: [
          {
            link: 'https://example.com/1',
            image_hash: 'hash-1',
            name: 'Card 1',
          },
          {
            link: 'https://example.com/2',
            image_hash: 'hash-2',
            name: 'Card 2',
            description: 'Second card',
          },
        ],
        multi_share_optimized: true,
        call_to_action: { type: 'SHOP_NOW' },
      },
    })
  })

  it('builds the video_data shape for a video STORY', () => {
    const input: CreateStoryCreativeInput = {
      ...base,
      format: 'STORY',
      mediaType: 'VIDEO',
      mediaAssetId: 'media-6',
      message: 'Story time',
      callToActionType: 'LEARN_MORE',
      ctaLink: 'https://example.com/story',
    }
    const spec = buildObjectStorySpec(input, { videoId: 'vid-789' })
    expect(spec).toEqual({
      page_id: 'page-1',
      instagram_user_id: 'ig-1',
      video_data: {
        video_id: 'vid-789',
        message: 'Story time',
        call_to_action: {
          type: 'LEARN_MORE',
          value: { link: 'https://example.com/story' },
        },
      },
    })
  })

  it('builds the link_data shape for an image STORY', () => {
    const input: CreateStoryCreativeInput = {
      ...base,
      format: 'STORY',
      mediaType: 'IMAGE',
      mediaAssetId: 'media-7',
    }
    const spec = buildObjectStorySpec(input, { imageHash: 'hash-story' })
    expect(spec).toEqual({
      page_id: 'page-1',
      instagram_user_id: 'ig-1',
      link_data: { image_hash: 'hash-story' },
    })
  })
})

const readyImageAsset = {
  id: 'media-1',
  type: 'IMAGE',
  status: 'READY',
  metaImageHash: 'hash-abc',
  metaVideoId: null,
  sourceUrl: 'https://cdn.example.com/img.jpg',
}

function imagePostCreative(
  overrides: Partial<AdCreativeModel> = {},
): AdCreativeModel {
  return {
    id: 'creative-1',
    adSetId: 'adset-1',
    userId: 'user-1',
    name: 'Test creative',
    format: 'IMAGE_POST',
    pageId: 'page-1',
    instagramUserId: null,
    objectStorySpec: {
      page_id: 'page-1',
      link_data: {
        image_hash: 'hash-abc',
        link: 'https://example.com',
        message: 'Buy now',
        call_to_action: { type: 'SHOP_NOW' },
      },
    },
    aiGenerated: false,
    aiDisclosureLabel: false,
    metaCreativeId: null,
    metaReviewFeedback: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as unknown as AdCreativeModel
}

describe('deriveCreativeDetails', () => {
  beforeEach(() => {
    vi.mocked(prisma.mediaAsset.findFirst).mockReset()
  })

  it('resolves image_hash back to a local mediaAssetId + url for IMAGE_POST', async () => {
    vi.mocked(prisma.mediaAsset.findFirst).mockResolvedValueOnce(
      readyImageAsset as never,
    )
    const details = await deriveCreativeDetails('user-1', imagePostCreative())
    expect(details).toEqual({
      mediaAssetId: 'media-1',
      mediaAssetUrl: 'https://cdn.example.com/img.jpg',
      link: 'https://example.com',
      message: 'Buy now',
      callToActionType: 'SHOP_NOW',
    })
  })

  it('omits mediaAssetId when no matching local MediaAsset is found', async () => {
    vi.mocked(prisma.mediaAsset.findFirst).mockResolvedValueOnce(null)
    const details = await deriveCreativeDetails('user-1', imagePostCreative())
    expect(details.mediaAssetId).toBeUndefined()
    expect(details.message).toBe('Buy now')
  })
})

describe('updateAdCreative', () => {
  beforeEach(() => {
    vi.mocked(prisma.adCreative.findFirst).mockReset()
    vi.mocked(prisma.adCreative.updateMany)
      .mockReset()
      .mockResolvedValue({ count: 1 })
    vi.mocked(prisma.mediaAsset.findFirst)
      .mockReset()
      .mockResolvedValue(readyImageAsset as never)
    vi.mocked(syncCreativeEditToMeta).mockReset()
  })

  it('returns null when the creative is not found', async () => {
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce(null)
    const result = await updateAdCreative(
      'user-1',
      'campaign-1',
      'adset-1',
      'creative-1',
      { message: 'Updated' },
    )
    expect(result).toBeNull()
    expect(prisma.adCreative.updateMany).not.toHaveBeenCalled()
  })

  it('merges the update into the current spec and saves locally without touching Meta when not yet published', async () => {
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce(
      imagePostCreative() as never,
    )
    await updateAdCreative('user-1', 'campaign-1', 'adset-1', 'creative-1', {
      message: 'New message',
    })
    expect(prisma.adCreative.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'creative-1', adSetId: 'adset-1', userId: 'user-1' },
        data: expect.objectContaining({
          objectStorySpec: expect.objectContaining({
            link_data: expect.objectContaining({ message: 'New message' }),
          }),
        }),
      }),
    )
    expect(syncCreativeEditToMeta).not.toHaveBeenCalled()
  })

  it('pushes a replacement creative and repoints live ads when the creative was already published', async () => {
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce(
      imagePostCreative({ metaCreativeId: 'meta-creative-1' }) as never,
    )
    await updateAdCreative('user-1', 'campaign-1', 'adset-1', 'creative-1', {
      message: 'New message',
    })
    expect(syncCreativeEditToMeta).toHaveBeenCalledWith(
      'user-1',
      'campaign-1',
      'adset-1',
      'creative-1',
    )
  })

  it('throws AdCreativeValidationError when the merged result fails re-validation', async () => {
    vi.mocked(prisma.adCreative.findFirst).mockResolvedValueOnce(
      imagePostCreative() as never,
    )
    await expect(
      updateAdCreative('user-1', 'campaign-1', 'adset-1', 'creative-1', {
        link: 'not-a-url',
      }),
    ).rejects.toBeInstanceOf(AdCreativeValidationError)
    expect(prisma.adCreative.updateMany).not.toHaveBeenCalled()
  })
})
