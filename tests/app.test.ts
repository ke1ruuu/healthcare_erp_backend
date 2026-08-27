import { describe, expect, it } from 'bun:test'
import { app } from '@/app'

describe('Healthcare ERP Backend API — Root & System Routing', () => {
  it('GET / should return 200, operational status, documentation links, and version discovery', async () => {
    const res = await app.fetch(new Request('http://localhost/'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.name).toBe('Healthcare ERP Backend API')
    expect(data.status).toBe('operational')
    expect(data.documentation.swaggerUi).toBe('/docs')
    expect(data.healthCheck).toBe('/health')
    expect(data.versions.v1.path).toBe('/api/v1')
  })

  it('GET /api/v1 should return 200 and v1 discovery metadata', async () => {
    const res = await app.fetch(new Request('http://localhost/api/v1'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.version).toBe('v1')
    expect(data.status).toBe('active')
    expect(data.endpoints.users).toBe('/api/v1/users')
    expect(data.endpoints.patients).toBe('/api/v1/patients')
  })

  it('GET /unknown-route should return 404 with structured error envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/unknown-route'))
    expect(res.status).toBe(404)

    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.status).toBe(404)
    expect(data.message).toContain('Route not found')
  })
})
