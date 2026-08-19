import { z } from '@hono/zod-openapi'

export const BusinessProfileSchema = z.object({
  businessName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  goal: z.string().max(100).optional(),
  signatureProduct: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  adExperience: z.string().max(100).optional(),
  budget: z.string().max(100).optional(),
  platforms: z.array(z.string()).max(10).optional(),
})

export const FollowupQaSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
})

export const FollowupQuestionRequestSchema = z
  .object({
    businessProfile: BusinessProfileSchema,
    previousAnswers: z.array(FollowupQaSchema).max(5),
  })
  .openapi('FollowupQuestionRequest')

export const FollowupQuestionResponseSchema = z
  .object({
    done: z.boolean(),
    question: z.string().nullable(),
    type: z.enum(['text', 'choice']),
    choices: z.array(z.string()).nullable(),
  })
  .openapi('FollowupQuestionResponse')

export type FollowupQuestionRequest = z.infer<
  typeof FollowupQuestionRequestSchema
>
