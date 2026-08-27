import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '@/config/env'
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware'
import { registerRoutes } from '@/routes'

export function createApp(): Hono {
  const app = new Hono()

  // Global Middlewares
  app.use('*', logger())
  app.use('*', secureHeaders())
  app.use('*', prettyJSON())

  // CORS Middleware
  const allowedOrigins =
    env.CORS_ORIGIN === '*'
      ? '*'
      : env.CORS_ORIGIN.split(',').map((origin) => origin.trim())

  app.use(
    '*',
    cors({
      origin: allowedOrigins,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  )

  // Central Route Registration
  registerRoutes(app)

  // Centralized Error & 404 Handling
  app.onError(errorHandler)
  app.notFound(notFoundHandler)

  return app
}

export const app = createApp()
