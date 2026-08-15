import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { getCookie } from 'hono/cookie'
import { verifySessionToken, InvalidSessionTokenError } from '../lib/auth.js'
import { SESSION_COOKIE_NAME } from '../lib/cookie.js'

export type AuthVariables = {
  userId: string
}

const CSRF_GUARDED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const token = getCookie(c, SESSION_COOKIE_NAME)
    if (!token) {
      throw new HTTPException(401, { message: 'Unauthorized' })
    }
    // The session cookie is SameSite=Lax, which already blocks it being sent
    // on most cross-site requests. This header check closes the remaining
    // gap (simple cross-site form posts, which are exempt from SameSite=Lax
    // restrictions on top-level navigation) without needing a full
    // double-submit CSRF token — a plain cross-site <form> can't set custom
    // headers.
    if (CSRF_GUARDED_METHODS.has(c.req.method)) {
      const requestedWith = c.req.header('X-Requested-With')
      if (requestedWith !== 'XMLHttpRequest') {
        throw new HTTPException(403, { message: 'Forbidden' })
      }
    }
    try {
      const { userId } = await verifySessionToken(token)
      c.set('userId', userId)
    } catch (err) {
      if (err instanceof InvalidSessionTokenError) {
        throw new HTTPException(401, { message: 'Unauthorized' })
      }
      throw err
    }
    await next()
  },
)
