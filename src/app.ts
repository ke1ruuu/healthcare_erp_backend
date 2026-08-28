import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '@/config/env'
import { requestIdMiddleware } from '@/middlewares/request-id.middleware'
import { requestLoggerMiddleware } from '@/middlewares/logger.middleware'
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware'
import { registerRoutes } from '@/routes'

export function createApp(): Hono {
  const app = new Hono()

  // Correlation ID Middleware (Must run first to stamp context & headers)
  app.use('*', requestIdMiddleware)

  // Structured Request Logging (With correlation ID & precise timing)
  app.use('*', requestLoggerMiddleware)

  // Security & Formatting Middlewares
  app.use('*', secureHeaders())
  app.use('*', prettyJSON())

  // CORS Configuration
  const allowedOrigins =
    env.CORS_ORIGIN === '*'
      ? '*'
      : env.CORS_ORIGIN.split(',').map((origin) => origin.trim())

  app.use(
    '*',
    cors({
      origin: allowedOrigins,
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
      exposeHeaders: ['X-Request-ID', 'X-Correlation-ID'],
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
