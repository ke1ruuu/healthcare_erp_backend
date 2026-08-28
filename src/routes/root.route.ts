import { Hono } from 'hono'
import { env } from '@/config/env'

export const rootRoute = new Hono()

rootRoute.get('/', (c) => {
  return c.json({
    name: 'Healthcare ERP Backend API',
    version: '1.0.4',
    environment: env.NODE_ENV,
    status: 'operational',
    uptime: process.uptime(),
    dashboard: '/dashboard',
    documentation: {
      swaggerUi: '/docs',
      openApiJson: '/docs/openapi.json',
    },
    healthCheck: '/health',
    versions: {
      v1: {
        status: 'current',
        path: '/api/v1',
        description: 'Version 1.0 (Active)',
      },
    },
  })
})
