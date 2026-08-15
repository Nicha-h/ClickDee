import { SignJWT, jwtVerify, errors } from 'jose'
import { env } from '../config/env.js'

export class InvalidSessionTokenError extends Error {}

const secretKey = new TextEncoder().encode(env.AUTH_JWT_SECRET)
const SESSION_DURATION = '24h'
export const SESSION_DURATION_SECONDS = 24 * 60 * 60

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secretKey)
}

export async function verifySessionToken(
  token: string,
): Promise<{ userId: string }> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    if (typeof payload.sub !== 'string') {
      throw new InvalidSessionTokenError('Token missing subject')
    }
    return { userId: payload.sub }
  } catch (err) {
    if (err instanceof errors.JOSEError) {
      throw new InvalidSessionTokenError(err.message)
    }
    throw err
  }
}
