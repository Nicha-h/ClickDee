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
