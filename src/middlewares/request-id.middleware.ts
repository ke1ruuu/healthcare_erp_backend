import type { MiddlewareHandler } from 'hono'

export const REQUEST_ID_HEADER = 'X-Request-ID'
export const CORRELATION_ID_HEADER = 'X-Correlation-ID'

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const incomingId =
    c.req.header(REQUEST_ID_HEADER) ||
    c.req.header(CORRELATION_ID_HEADER) ||
    c.req.header('x-request-id') ||
    c.req.header('x-correlation-id')

  const requestId = incomingId && incomingId.trim().length > 0 ? incomingId.trim() : crypto.randomUUID()

  // Store in Hono context
  c.set('requestId', requestId)

  // Execute downstream handlers
  await next()

  // Set response correlation headers
  c.header(REQUEST_ID_HEADER, requestId)
  c.header(CORRELATION_ID_HEADER, requestId)
}
