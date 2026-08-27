import { describe, expect, it } from 'bun:test'
import { app } from '@/app'

describe('Request Correlation ID Middleware & Tracing', () => {
  it('should auto-generate a valid UUID requestId and return headers when none is provided', async () => {
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)

    const requestId = res.headers.get('X-Request-ID')
    const correlationId = res.headers.get('X-Correlation-ID')

    expect(requestId).toBeDefined()
    expect(correlationId).toBeDefined()
    expect(requestId).toBe(correlationId)
    // Verify valid UUID format
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  it('should preserve custom incoming X-Request-ID header', async () => {
    const customId = 'client-tracing-id-9988-aabb'
    const res = await app.fetch(
      new Request('http://localhost/', {
        headers: { 'X-Request-ID': customId },
      })
    )
    expect(res.status).toBe(200)

    expect(res.headers.get('X-Request-ID')).toBe(customId)
    expect(res.headers.get('X-Correlation-ID')).toBe(customId)
  })

  it('should include requestId in 404 error envelope', async () => {
    const customId = 'gateway-err-trace-1234'
    const res = await app.fetch(
      new Request('http://localhost/non-existent-endpoint', {
        headers: { 'X-Request-ID': customId },
      })
    )
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('RESOURCE_NOT_FOUND')
    expect(json.requestId).toBe(customId)
    expect(res.headers.get('X-Request-ID')).toBe(customId)
  })

  it('should include requestId in validation error envelope', async () => {
    const customId = 'validation-trace-4567'
    const res = await app.fetch(
      new Request('http://localhost/api/v1/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': customId,
        },
        body: JSON.stringify({}), // Empty body triggers validation error
      })
    )
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.requestId).toBe(customId)
  })
})
