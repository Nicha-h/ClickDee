import {
  META_GRAPH_BASE_URL,
  META_GRAPH_VIDEO_BASE_URL,
} from '../config/meta.js'

// --- Error classes -----------------------------------------------------
// One class per Meta error code we need to handle differently (cross-cutting
// requirement): 190 (expired/invalid token -> re-auth), 17/32/613 (rate
// limit -> exponential backoff), 100 (invalid parameter -> surface Meta's
// own user-facing message), 2635 (ad policy violation -> "needs revision").
// Anything else falls back to the generic MetaApiError.

interface MetaErrorBody {
  message: string
  type?: string
  code: number
  error_subcode?: number
  fbtrace_id?: string
  error_user_title?: string
  error_user_msg?: string
  error_data?: { retry_after?: number }
}

export class MetaApiError extends Error {
  code: number
  errorSubcode?: number
  httpStatus: number
  errorUserTitle?: string
  errorUserMsg?: string
  fbtraceId?: string
  retryAfterSeconds?: number

  constructor(body: MetaErrorBody, httpStatus: number) {
    super(body.message)
    this.name = 'MetaApiError'
    this.code = body.code
    this.errorSubcode = body.error_subcode
    this.httpStatus = httpStatus
    this.errorUserTitle = body.error_user_title
    this.errorUserMsg = body.error_user_msg
    this.fbtraceId = body.fbtrace_id
    this.retryAfterSeconds = body.error_data?.retry_after
  }
}

export class MetaTokenExpiredError extends MetaApiError {}
export class MetaRateLimitError extends MetaApiError {}
export class MetaInvalidParameterError extends MetaApiError {}
export class MetaPolicyViolationError extends MetaApiError {}

const RATE_LIMIT_CODES = new Set([17, 32, 613])

function toMetaError(body: MetaErrorBody, httpStatus: number): MetaApiError {
  if (body.code === 190) return new MetaTokenExpiredError(body, httpStatus)
  if (RATE_LIMIT_CODES.has(body.code))
    return new MetaRateLimitError(body, httpStatus)
  if (body.code === 100) return new MetaInvalidParameterError(body, httpStatus)
  if (body.code === 2635) return new MetaPolicyViolationError(body, httpStatus)
  return new MetaApiError(body, httpStatus)
}

// --- Request helpers -----------------------------------------------------

export type MetaHttpMethod = 'GET' | 'POST' | 'DELETE'

export interface MetaRequestOptions {
  method?: MetaHttpMethod
  accessToken: string
  params?: Record<string, unknown>
  /** Use the video upload subdomain (graph-video.facebook.com) instead of graph.facebook.com. */
  video?: boolean
}

function serializeParam(value: unknown): string {
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function buildUrl(path: string, video: boolean): URL {
  const base = video ? META_GRAPH_VIDEO_BASE_URL : META_GRAPH_BASE_URL
  return new URL(`${base}/${path.replace(/^\/+/, '')}`)
}

async function parseErrorResponse(res: Response): Promise<MetaApiError> {
  let body: { error?: MetaErrorBody } | undefined
  try {
    body = await res.json()
  } catch {
    // Non-JSON error body (rare, but possible on network-layer failures
    // proxied through the same status code) — fall back to a generic error
    // carrying whatever text is available.
    return new MetaApiError(
      {
        message: `Meta API request failed with status ${res.status}`,
        code: -1,
      },
      res.status,
    )
  }
  if (!body?.error) {
    return new MetaApiError(
      {
        message: `Meta API request failed with status ${res.status}`,
        code: -1,
      },
      res.status,
    )
  }
  return toMetaError(body.error, res.status)
}

// Single JSON/form-encoded request against the Graph API. Not for file
// uploads — see metaUploadFile below, which needs multipart/form-data.
export async function metaRequest<T>(
  path: string,
  options: MetaRequestOptions,
): Promise<T> {
  const { method = 'GET', accessToken, params = {}, video = false } = options
  const url = buildUrl(path, video)

  let res: Response
  if (method === 'GET' || method === 'DELETE') {
    url.searchParams.set('access_token', accessToken)
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue
      url.searchParams.set(key, serializeParam(value))
    }
    res = await fetch(url, { method })
  } else {
    const body = new URLSearchParams()
    body.set('access_token', accessToken)
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue
      body.set(key, serializeParam(value))
    }
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  }

  if (!res.ok) throw await parseErrorResponse(res)
  return (await res.json()) as T
}

export interface MetaUploadFileOptions {
  accessToken: string
  /** Extra non-file form fields to send alongside the file (e.g. `name` for /advideos). */
  fields?: Record<string, string>
  fileFieldName: string
  fileName: string
  fileContentType: string
  fileData: Buffer
  video?: boolean
}

// Multipart upload for /adimages and /advideos — media must be uploaded
// first and referenced by hash/id in the creative call, never sent as raw
// bytes in the creative payload itself.
export async function metaUploadFile<T>(
  path: string,
  options: MetaUploadFileOptions,
): Promise<T> {
  const {
    accessToken,
    fields = {},
    fileFieldName,
    fileName,
    fileContentType,
    fileData,
    video = false,
  } = options
  const url = buildUrl(path, video)

  const form = new FormData()
  form.set('access_token', accessToken)
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  form.set(
    fileFieldName,
    new Blob([new Uint8Array(fileData)], { type: fileContentType }),
    fileName,
  )

  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) throw await parseErrorResponse(res)
  return (await res.json()) as T
}

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BASE_DELAY_MS = 1000

function backoffDelayMs(attempt: number, retryAfterSeconds?: number): number {
  if (retryAfterSeconds !== undefined) return retryAfterSeconds * 1000
  const exp = DEFAULT_BASE_DELAY_MS * 2 ** attempt
  const jitter = Math.random() * DEFAULT_BASE_DELAY_MS
  return exp + jitter
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Wraps any Meta call with exponential backoff + jitter, specifically for
// MetaRateLimitError (code 17/32/613) — the "17: rate limit" cross-cutting
// requirement. Every other error (including 190/100/2635) rethrows
// immediately since retrying won't help.
export async function metaRequestWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!(err instanceof MetaRateLimitError) || attempt === maxRetries) {
        throw err
      }
      lastError = err
      await sleep(backoffDelayMs(attempt, err.retryAfterSeconds))
    }
  }
  // Unreachable (loop always returns or throws), but keeps TS satisfied.
  throw lastError
}
