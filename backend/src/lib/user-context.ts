import type { UserModel } from '../generated/prisma/models.js'

export function buildContextLine(user: UserModel | null): string | undefined {
  if (!user?.businessName) return undefined
  const fields: [string, string | null | undefined][] = [
    ['category', user.category],
    ['goal', user.goal],
    ['location', user.location],
    ['signatureProduct', user.signatureProduct],
    ['adExperience', user.adExperience],
    ['budget', user.budget],
  ]
  const parts = fields.filter(([, v]) => v).map(([k, v]) => `${k}=${v}`)
  if (user.platforms.length > 0) {
    parts.push(`platforms=${user.platforms.join(', ')}`)
  }
  return `Business context: name=${user.businessName}${parts.length ? ', ' + parts.join(', ') : ''}.`
}
