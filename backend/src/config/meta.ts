import { env } from './env.js'

// Single source of truth for the Marketing API version — every Meta call
// goes through lib/meta-client.ts, which builds its request URLs from these,
// so a version bump is a one-line env change (META_API_VERSION), not a
// per-call find-and-replace.
export const META_API_VERSION = env.META_API_VERSION
export const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`
export const META_GRAPH_VIDEO_BASE_URL = `https://graph-video.facebook.com/${META_API_VERSION}`

// Thrown by any service that needs to actually call Meta when
// getDevMetaCredentials() returns null — lets routes surface a clear "Meta
// isn't connected yet" error instead of a confusing downstream failure.
export class MetaNotConfiguredError extends Error {
  constructor() {
    super(
      'Meta connection is not configured yet — set META_DEV_ACCESS_TOKEN/META_DEV_AD_ACCOUNT_ID/META_DEV_PAGE_ID to enable calling the Meta API.',
    )
    this.name = 'MetaNotConfiguredError'
  }
}

export interface MetaCredentials {
  accessToken: string
  adAccountId: string
  pageId: string
  instagramUserId?: string
}

// Stand-in for the not-yet-built per-user OAuth connection flow (see
// backend/docs/meta-marketing-api-findings.md section 4). Every service that
// needs to call Meta reads credentials through this single seam, so swapping
// in a real per-user connection lookup later is a one-function change rather
// than a repo-wide search for env.META_DEV_*.
export function getDevMetaCredentials(): MetaCredentials | null {
  if (
    !env.META_DEV_ACCESS_TOKEN ||
    !env.META_DEV_AD_ACCOUNT_ID ||
    !env.META_DEV_PAGE_ID
  ) {
    return null
  }
  return {
    accessToken: env.META_DEV_ACCESS_TOKEN,
    adAccountId: env.META_DEV_AD_ACCOUNT_ID,
    pageId: env.META_DEV_PAGE_ID,
    instagramUserId: env.META_DEV_INSTAGRAM_USER_ID,
  }
}
