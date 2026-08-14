import 'dotenv/config'
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
  AZURE_OPENAI_KEY: z.string().min(1).optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().min(1).optional(),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
