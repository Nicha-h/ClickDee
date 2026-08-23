import type { OpenAPIHono } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import {
  MetaApiError,
  MetaTokenExpiredError,
  MetaRateLimitError,
  MetaInvalidParameterError,
  MetaPolicyViolationError,
} from '../lib/meta-client.js'
import { MetaNotConfiguredError } from '../config/meta.js'
import { AdSetValidationError } from '../services/ad-set.service.js'
import { AdCreativeValidationError } from '../services/ad-creative.service.js'
import { AdValidationError } from '../services/ad.service.js'
import { MetaPublishValidationError } from '../services/meta-publish.service.js'

// Central mapping for the Meta-specific error codes this app has to handle
// (cross-cutting requirement): 190 (expired/invalid token) -> 401 with a
// re-auth flag, 17/32/613 (rate limit) -> 429, 100 (invalid parameter) ->
// 400 with Meta's own SME-facing message when available, 2635 (ad policy
// violation) -> 422 "needs revision". Kept in one place (the global
// onError handler) rather than repeated per route.
function mapMetaError(err: MetaApiError): {
  status: 401 | 429 | 400 | 422 | 502
  body: Record<string, unknown>
} {
  if (err instanceof MetaTokenExpiredError) {
    return {
      status: 401,
      body: {
        message: 'Your Meta connection has expired — please reconnect.',
        reauth: true,
      },
    }
  }
  if (err instanceof MetaRateLimitError) {
    return {
      status: 429,
      body: {
        message:
          'Meta is rate-limiting requests right now — please try again shortly.',
      },
    }
  }
  if (err instanceof MetaInvalidParameterError) {
    return {
      status: 400,
      body: {
        message: err.errorUserMsg ?? err.errorUserTitle ?? err.message,
      },
    }
  }
  if (err instanceof MetaPolicyViolationError) {
    return {
      status: 422,
      body: {
        message:
          err.errorUserMsg ??
          'This creative was rejected by Meta and needs revision.',
      },
    }
  }
  return { status: 502, body: { message: `Meta API error: ${err.message}` } }
}

export function registerErrorHandlers(app: OpenAPIHono) {
  app.notFound((c) => c.json({ message: 'Not Found' }, 404))

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      return c.json({ message: err.message }, err.status)
    }
    if (err instanceof MetaApiError) {
      const { status, body } = mapMetaError(err)
      return c.json(body, status)
    }
    if (err instanceof MetaNotConfiguredError) {
      return c.json({ message: err.message }, 400)
    }
    if (
      err instanceof AdSetValidationError ||
      err instanceof AdCreativeValidationError ||
      err instanceof AdValidationError ||
      err instanceof MetaPublishValidationError
    ) {
      return c.json({ message: err.message }, 400)
    }
    console.error(err)
    return c.json({ message: 'Internal Server Error' }, 500)
  })
}
