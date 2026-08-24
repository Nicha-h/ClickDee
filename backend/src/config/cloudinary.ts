import { env } from './env.js'

// Thrown by any caller that needs Cloudinary to actually be configured (the
// seed script — see scripts/seed-admin810.ts). The live upload path
// (media.service.ts) never throws this: a missing/failed Cloudinary upload
// there is non-fatal, it just skips the preview URL.
export class CloudinaryNotConfiguredError extends Error {
  constructor() {
    super(
      'Cloudinary is not configured — set CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET to enable media preview hosting.',
    )
    this.name = 'CloudinaryNotConfiguredError'
  }
}

export interface CloudinaryCredentials {
  cloudName: string
  apiKey: string
  apiSecret: string
}

// Same "all-or-nothing, optional" seam as config/meta.ts's
// getDevMetaCredentials — every caller that needs Cloudinary reads
// credentials through this one function.
export function getCloudinaryCredentials(): CloudinaryCredentials | null {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    return null
  }
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  }
}
