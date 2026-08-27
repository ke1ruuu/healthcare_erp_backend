import type { Hono } from 'hono'
import { rootRoute } from './root.route'
import { healthRoute } from './health.route'
import { docsRoute } from './docs.route'
import { v1Route } from './v1.route'
import { dashboardRoute } from './dashboard.route'

export function registerRoutes(app: Hono): void {
  // 1. Root & Diagnostic Routes
  app.route('/', rootRoute)
  app.route('/health', healthRoute)

  // 2. Monitoring & Telemetry Dashboard
  app.route('/dashboard', dashboardRoute)
  app.get('/monitor', (c) => c.redirect('/dashboard'))
  app.get('/status', (c) => c.redirect('/dashboard'))

  // 3. Interactive Swagger & OpenAPI Documentation
  app.route('/docs', docsRoute)
  app.get('/swagger', (c) => c.redirect('/docs'))

  // 4. API Version Routes
  app.route('/api/v1', v1Route)
}
