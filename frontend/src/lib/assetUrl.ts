import { apiBaseUrl } from '@/api/env'

// Some MediaAsset URLs from the backend are relative ("/static/...", see
// backend/scripts/seed-admin810.ts + backend/src/app.ts's '/static/*' route)
// since the backend can't know its own externally-reachable origin — in
// production it runs on a container-internal port, only reachable through
// nginx same-origin (see docker/nginx.conf). Real Meta-hosted media URLs are
// already absolute and pass through unchanged.
export function resolveAssetUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined
  return url.startsWith('/') ? `${apiBaseUrl}${url}` : url
}
