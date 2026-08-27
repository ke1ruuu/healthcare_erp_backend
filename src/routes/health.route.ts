import { Hono } from 'hono'
import { prisma } from '@/db/prisma'
import { env } from '@/config/env'

export const healthRoute = new Hono()

healthRoute.get('/', async (c) => {
  let dbStatus = 'disconnected'
  let dbLatencyMs: number | null = null

  try {
    const start = performance.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Math.round(performance.now() - start)
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'unreachable'
  }

  const isHealthy = dbStatus === 'connected'

  return c.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      uptime: process.uptime(),
      services: {
        api: 'running',
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
    },
    isHealthy ? 200 : 503
  )
})
