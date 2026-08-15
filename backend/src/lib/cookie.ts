import type { Context } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { env } from '../config/env.js'
import { SESSION_DURATION_SECONDS } from './auth.js'

const SESSION_COOKIE_NAME = 'session'

export function setSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' })
}

export { SESSION_COOKIE_NAME }
