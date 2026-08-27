import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { env } from '@/config/env'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[Error] ${c.req.method} ${c.req.url}:`, err)

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        status: err.status,
        message: err.message,
      },
      err.status
    )
  }

  const isDev = env.NODE_ENV === 'development'

  return c.json(
    {
      success: false,
      status: 500,
      message: isDev ? err.message || 'Internal Server Error' : 'Internal Server Error',
      ...(isDev && { stack: err.stack }),
    },
    500
  )
}

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      success: false,
      status: 404,
      message: `Route not found: ${c.req.method} ${c.req.path}`,
    },
    404
  )
}
