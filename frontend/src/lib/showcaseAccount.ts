export const SHOWCASE_ACCOUNT_EMAIL = 'admin810@gmail.com'

export function isShowcaseAccount(email: string | null | undefined): boolean {
  return email === SHOWCASE_ACCOUNT_EMAIL
}
