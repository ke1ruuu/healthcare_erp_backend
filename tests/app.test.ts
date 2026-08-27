import { describe, expect, it } from 'bun:test'
import server from '@/index'

describe('Healthcare ERP Backend API', () => {
  it('GET / should return 200 and API metadata', async () => {
    const res = await server.fetch(new Request('http://localhost:3000/'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.name).toBe('Healthcare ERP Backend API')
    expect(data.status).toBe('active')
  })

  it('GET /404 route should return 404 with structured error JSON', async () => {
    const res = await server.fetch(new Request('http://localhost:3000/unknown-route'))
    expect(res.status).toBe(404)

    const data = await res.json()
    expect(data.success).toBe(false)
    expect(data.status).toBe(404)
    expect(data.message).toContain('Route not found')
  })
})
