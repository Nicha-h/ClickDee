const USER_ID_KEY = 'clickdee_user_id'
const AUTH_TOKEN_KEY = 'clickdee_auth_token'

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY)
}

export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY)
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function authHeaders(): RequestInit {
  const token = getAuthToken()
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
}
