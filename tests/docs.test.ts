import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { docsRoute } from '@/routes/docs.route'

describe('Swagger UI & OpenAPI Documentation', () => {
  const app = new Hono()
  app.route('/docs', docsRoute)
  app.get('/swagger', (c) => c.redirect('/docs'))

  it('GET /docs/openapi.json should return valid OpenAPI 3.1 specification', async () => {
    const res = await app.fetch(new Request('http://localhost/docs/openapi.json'))
    expect(res.status).toBe(200)

    const spec = await res.json()
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.info.title).toBe('Healthcare ERP Backend API')
    expect(spec.info.version).toBe('1.0.4')
    expect(spec.paths).toBeDefined()
    expect(spec.paths['/health']).toBeDefined()
    expect(spec.paths['/api/v1/auth/login']).toBeDefined()
    expect(spec.paths['/api/v1/auth/me']).toBeDefined()
    expect(spec.paths['/api/v1/users']).toBeDefined()
    expect(spec.paths['/api/v1/patients']).toBeDefined()
    expect(spec.components.schemas.LoginRequest).toBeDefined()
    expect(spec.components.schemas.UserResponse).toBeDefined()
    expect(spec.components.schemas.PatientResponse).toBeDefined()
    expect(spec.components.securitySchemes.BearerAuth).toBeDefined()
  })

  it('GET /docs should serve the interactive Swagger UI', async () => {
    const res = await app.fetch(new Request('http://localhost/docs'))
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('swagger-ui')
  })

  it('GET /swagger should redirect to /docs', async () => {
    const res = await app.fetch(new Request('http://localhost/swagger'), {
      redirect: 'manual',
    })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/docs')
  })
})
