import { prisma } from '../db/client.js'
import { hashPassword } from '../lib/password.js'
import type { SignupInput, UpdateAccountInput } from '../schemas/auth.schema.js'

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } })
}

export function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } })
}

export function updateUser(id: string, input: UpdateAccountInput) {
  return prisma.user.update({ where: { id }, data: input })
}

export async function createUser(input: SignupInput) {
  const passwordHash = await hashPassword(input.password)
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      businessName: input.businessName,
      location: input.location,
      category: input.category,
      categoryOther: input.categoryOther,
      adExperience: input.adExperience,
      budget: input.budget,
      goal: input.goal,
      signatureProduct: input.signatureProduct,
      platforms: input.platforms ?? [],
      peakHours: input.peakHours,
      promoHighlight: input.promoHighlight,
    },
  })
}
