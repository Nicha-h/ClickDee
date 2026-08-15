const USER_ID_KEY = 'clickdee_user_id'

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY)
}

// Session lives in an httpOnly cookie, not JS-readable state — the browser
// attaches it automatically. `credentials: 'include'` is what makes it ride
// along on cross-port dev requests (localhost:5173 -> localhost:3000), and
// the backend's requireAuth middleware requires this header on every
// mutating request as a lightweight CSRF check (SameSite=Lax already blocks
// the cookie on most cross-site requests; a plain cross-site form can't set
// custom headers). Sending it on GETs too is harmless, so every authenticated
// call uses this helper rather than varying it per method.
export function withCredentials(): RequestInit {
  return {
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  }
}
