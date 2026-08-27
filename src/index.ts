import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'
import { env } from '@/config/env'
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware'
import { healthRoute } from '@/routes/health.route'
import { docsRoute } from '@/routes/docs.route'
import { userRoute } from '@/modules/users'
import { patientRoute } from '@/modules/patients'

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

// Root API Welcome / Metadata
app.get('/', (c) => {
  return c.json({
    name: 'Healthcare ERP Backend API',
    version: '1.0.1',
    environment: env.NODE_ENV,
    status: 'active',
    documentation: '/docs',
  })
})

// Documentation & Swagger UI
app.route('/docs', docsRoute)
app.get('/swagger', (c) => c.redirect('/docs'))

// Route Modules
app.route('/health', healthRoute)
app.route('/api/v1/users', userRoute)
app.route('/api/v1/patients', patientRoute)

// Centralized Error Handling
app.onError(errorHandler)
app.notFound(notFoundHandler)

console.log(`Healthcare ERP Backend running on http://localhost:${env.PORT} [${env.NODE_ENV}]`)

export default {
  port: env.PORT,
  fetch: app.fetch,
}
