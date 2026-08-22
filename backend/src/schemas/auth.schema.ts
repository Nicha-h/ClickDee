import { z } from '@hono/zod-openapi'

export const AiMemoryQaSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
})

export const SignupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    businessName: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    categoryOther: z.string().min(1).optional(),
    adExperience: z.string().min(1).optional(),
    budget: z.string().min(1).optional(),
    goal: z.string().min(1).optional(),
    signatureProduct: z.string().min(1).optional(),
    platforms: z.array(z.string()).optional(),
    peakHours: z.string().min(1).optional(),
    promoHighlight: z.string().min(1).optional(),
    aiMemory: z.array(AiMemoryQaSchema).max(5).optional(),
    aiMemoryConsent: z.boolean().optional(),
  })
  .openapi('SignupInput')

export const LoginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .openapi('LoginInput')

export const UserSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    businessName: z.string().nullable(),
    location: z.string().nullable(),
    category: z.string().nullable(),
    categoryOther: z.string().nullable(),
    adExperience: z.string().nullable(),
    budget: z.string().nullable(),
    goal: z.string().nullable(),
    signatureProduct: z.string().nullable(),
    platforms: z.array(z.string()),
    peakHours: z.string().nullable(),
    promoHighlight: z.string().nullable(),
    customerPersona: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi('User')

export const AuthResponseSchema = UserSchema.openapi('AuthResponse')

export const DeleteAccountParamSchema = z.object({
  id: z.string().openapi({ param: { name: 'id', in: 'path' } }),
})

export const DeleteAccountSchema = z
  .object({ password: z.string().min(1) })
  .openapi('DeleteAccountInput')

export const UpdateAccountSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    businessName: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    budget: z.string().min(1).optional(),
    signatureProduct: z.string().min(1).optional(),
    customerPersona: z.string().min(1).optional(),
  })
  .openapi('UpdateAccountInput')

export type SignupInput = z.infer<typeof SignupSchema>
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>
