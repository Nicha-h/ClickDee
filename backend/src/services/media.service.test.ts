import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../db/client.js', () => ({
  prisma: {
    mediaAsset: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../lib/meta-client.js', () => ({
  metaUploadFile: vi.fn(),
  metaRequest: vi.fn(),
}))

vi.mock('../config/meta.js', () => ({
  getDevMetaCredentials: vi.fn(),
  MetaNotConfiguredError: class MetaNotConfiguredError extends Error {},
}))

vi.mock('../lib/cloudinary-client.js', () => ({
  uploadBufferToCloudinary: vi.fn(),
}))

import { prisma } from '../db/client.js'
import { metaUploadFile } from '../lib/meta-client.js'
import { getDevMetaCredentials, MetaNotConfiguredError } from '../config/meta.js'
import { uploadBufferToCloudinary } from '../lib/cloudinary-client.js'
import { env } from '../config/env.js'
import {
  uploadImage,
  uploadVideo,
  resolveMediaAssetPreviewUrl,
} from './media.service.js'

const credentials = {
  accessToken: 'token',
  adAccountId: 'act-1',
  pageId: 'page-1',
}

const file = {
  fileName: 'photo.jpg',
  contentType: 'image/jpeg',
  fileData: Buffer.from('fake-bytes'),
}

let originalSimulate: boolean

beforeEach(() => {
  vi.clearAllMocks()
  originalSimulate = env.META_SIMULATE_PUBLISH
  // The real .env this test run loads may have META_SIMULATE_PUBLISH=true
  // (a deliberate demo-mode setting, see backend/CLAUDE.md) — pin it false
  // here so the "real Meta" test cases below are deterministic regardless of
  // the developer's local .env; individual tests opt back into true.
  env.META_SIMULATE_PUBLISH = false
  vi.mocked(getDevMetaCredentials).mockReturnValue(credentials)
  vi.mocked(prisma.mediaAsset.create).mockResolvedValue({ id: 'asset-1' })
  vi.mocked(prisma.mediaAsset.update).mockImplementation(
    async ({ data }) => ({ id: 'asset-1', ...data }),
  )
})

afterEach(() => {
  env.META_SIMULATE_PUBLISH = originalSimulate
})

describe('resolveMediaAssetPreviewUrl', () => {
  it('prefers cloudinaryUrl over sourceUrl', () => {
    expect(
      resolveMediaAssetPreviewUrl({
        cloudinaryUrl: 'https://cloudinary/img.jpg',
        sourceUrl: 'https://meta/img.jpg',
      }),
    ).toBe('https://cloudinary/img.jpg')
  })

  it('falls back to sourceUrl when cloudinaryUrl is null', () => {
    expect(
      resolveMediaAssetPreviewUrl({
        cloudinaryUrl: null,
        sourceUrl: 'https://meta/img.jpg',
      }),
    ).toBe('https://meta/img.jpg')
  })

  it('returns null when neither is set', () => {
    expect(
      resolveMediaAssetPreviewUrl({ cloudinaryUrl: null, sourceUrl: null }),
    ).toBeNull()
  })
})

describe('uploadImage', () => {
  it('throws MetaNotConfiguredError before attempting any upload when Meta is unconfigured', async () => {
    vi.mocked(getDevMetaCredentials).mockReturnValue(null)

    await expect(uploadImage('user-1', file)).rejects.toBeInstanceOf(
      MetaNotConfiguredError,
    )
    expect(uploadBufferToCloudinary).not.toHaveBeenCalled()
    expect(metaUploadFile).not.toHaveBeenCalled()
  })

  it('persists both Meta and Cloudinary results on success', async () => {
    vi.mocked(uploadBufferToCloudinary).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/img.jpg',
      publicId: 'asset-1',
    })
    vi.mocked(metaUploadFile).mockResolvedValue({
      images: { source: { hash: 'meta-hash-1', url: 'https://meta/img.jpg' } },
    })

    await uploadImage('user-1', file)

    expect(uploadBufferToCloudinary).toHaveBeenCalledWith(
      expect.objectContaining({ publicId: 'asset-1', resourceType: 'image' }),
    )
    expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1' },
      data: {
        status: 'READY',
        metaImageHash: 'meta-hash-1',
        sourceUrl: 'https://meta/img.jpg',
        cloudinaryUrl: 'https://res.cloudinary.com/img.jpg',
        cloudinaryPublicId: 'asset-1',
      },
    })
  })

  it('does not fail the upload when Cloudinary rejects', async () => {
    vi.mocked(uploadBufferToCloudinary).mockRejectedValue(
      new Error('cloudinary down'),
    )
    vi.mocked(metaUploadFile).mockResolvedValue({
      images: { source: { hash: 'meta-hash-1', url: 'https://meta/img.jpg' } },
    })

    const result = await uploadImage('user-1', file)

    expect(result).toBeTruthy()
    expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1' },
      data: {
        status: 'READY',
        metaImageHash: 'meta-hash-1',
        sourceUrl: 'https://meta/img.jpg',
      },
    })
  })

  it('still persists a successful Cloudinary result when the Meta call fails', async () => {
    vi.mocked(uploadBufferToCloudinary).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/img.jpg',
      publicId: 'asset-1',
    })
    vi.mocked(metaUploadFile).mockRejectedValue(new Error('meta down'))

    await expect(uploadImage('user-1', file)).rejects.toThrow('meta down')

    expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1' },
      data: {
        status: 'FAILED',
        cloudinaryUrl: 'https://res.cloudinary.com/img.jpg',
        cloudinaryPublicId: 'asset-1',
      },
    })
  })

  it('still uploads to Cloudinary when META_SIMULATE_PUBLISH is true', async () => {
    env.META_SIMULATE_PUBLISH = true
    vi.mocked(uploadBufferToCloudinary).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/img.jpg',
      publicId: 'asset-1',
    })

    await uploadImage('user-1', file)

    expect(uploadBufferToCloudinary).toHaveBeenCalled()
    expect(metaUploadFile).not.toHaveBeenCalled()
    const [[updateArgs]] = vi.mocked(prisma.mediaAsset.update).mock.calls
    expect(updateArgs.data).toMatchObject({
      status: 'READY',
      cloudinaryUrl: 'https://res.cloudinary.com/img.jpg',
      cloudinaryPublicId: 'asset-1',
    })
    expect(updateArgs.data.metaImageHash).toMatch(/^sim_image_/)
  })
})

describe('uploadVideo', () => {
  it('merges Cloudinary fields into the real-path update alongside metaVideoId', async () => {
    vi.mocked(uploadBufferToCloudinary).mockResolvedValue({
      secureUrl: 'https://res.cloudinary.com/vid.mp4',
      publicId: 'asset-1',
    })
    vi.mocked(metaUploadFile).mockResolvedValue({ id: 'meta-video-1' })

    await uploadVideo('user-1', file)

    expect(uploadBufferToCloudinary).toHaveBeenCalledWith(
      expect.objectContaining({ resourceType: 'video' }),
    )
    expect(prisma.mediaAsset.update).toHaveBeenCalledWith({
      where: { id: 'asset-1' },
      data: {
        metaVideoId: 'meta-video-1',
        cloudinaryUrl: 'https://res.cloudinary.com/vid.mp4',
        cloudinaryPublicId: 'asset-1',
      },
    })
  })
})
