import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { getCloudinaryCredentials } from '../config/cloudinary.js'

export class CloudinaryUploadError extends Error {}

// Configures the SDK's module-level singleton exactly once, lazily, the
// first time an upload is actually attempted — mirrors meta-client.ts's
// "credentials read through one seam" convention rather than configuring
// eagerly at import time (env.ts is parsed before any config module is
// guaranteed to matter, and Cloudinary is fully optional).
let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  const credentials = getCloudinaryCredentials()
  if (!credentials) return false
  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  })
  configured = true
  return true
}

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
}

export interface CloudinaryUploadInput {
  buffer: Buffer
  publicId: string
  resourceType: 'image' | 'video'
  folder: string
}

// The SDK's upload() only accepts a file path/URL/base64 data URI, not a
// Buffer — upload_stream is the idiomatic way to hand it bytes already fully
// in memory (as media.service.ts's readUploadedFile produces). Its stream
// API is callback-only, so this wraps it in a Promise for callers.
export async function uploadBufferToCloudinary(
  input: CloudinaryUploadInput,
): Promise<CloudinaryUploadResult> {
  if (!ensureConfigured()) {
    throw new CloudinaryUploadError('Cloudinary is not configured.')
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: input.publicId,
        folder: input.folder,
        resource_type: input.resourceType,
        overwrite: true,
      },
      (err, result) => {
        if (err || !result) {
          reject(
            new CloudinaryUploadError(
              err?.message ?? 'Cloudinary upload failed',
            ),
          )
          return
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id })
      },
    )
    Readable.from(input.buffer).pipe(stream)
  })
}
