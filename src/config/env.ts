import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters' }).default('default-insecure-secret-key-change-me-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type AppEnv = z.infer<typeof envSchema>

const parseEnv = (): AppEnv => {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('[ERROR] Invalid environment variables:')
    console.error(JSON.stringify(result.error.format(), null, 2))
    process.exit(1)
  }

  return result.data
}

export const env = parseEnv()
