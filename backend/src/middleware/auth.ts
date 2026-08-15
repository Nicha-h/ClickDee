import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { verifySessionToken, InvalidSessionTokenError } from '../lib/auth.js'

export type AuthVariables = {
  userId: string
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const header = c.req.header('Authorization')
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) {
      throw new HTTPException(401, { message: 'Unauthorized' })
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
