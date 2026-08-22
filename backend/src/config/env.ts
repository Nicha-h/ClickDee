import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_BASE_URL: z
    .string()
    .url()
    .default('https://generativelanguage.googleapis.com/v1beta/openai/'),
  GROQ_API_KEY: z.string().min(1).optional(),
  GROQ_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1'),
  AUTH_JWT_SECRET: z.string().min(32),
  AI_MEMORY_ENCRYPTION_KEY: z.string().min(32),
  MAX_FOLLOWUP_QUESTIONS: z.coerce.number().int().positive().default(5),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
