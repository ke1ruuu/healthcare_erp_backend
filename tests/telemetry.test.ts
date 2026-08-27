import { describe, expect, it } from 'bun:test'
import { app } from '@/app'

describe('Telemetry & Monitoring Dashboard', () => {
  it('GET /api/v1/telemetry should return live system vitals and memory stats', async () => {
    const res = await app.fetch(new Request('http://localhost/api/v1/telemetry'))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.system.name).toBe('Healthcare ERP Backend')
    expect(json.data.memory.rssMB).toBeGreaterThan(0)
    expect(json.data.memory.heapUsedMB).toBeGreaterThan(0)
    expect(json.data.database.status).toBeDefined()
    expect(json.data.architecture.pattern).toContain('Modular-Monolith')
  })

  it('GET /dashboard should serve the monitoring dashboard SPA HTML', async () => {
    const res = await app.fetch(new Request('http://localhost/dashboard'))
    expect(res.status).toBe(200)

    const html = await res.text()
    expect(html).toContain('Healthcare ERP')
    expect(html).toContain('latencyChart')
    expect(html).toContain('/api/v1/telemetry')
  })

  it('GET /monitor and GET /status should redirect to /dashboard', async () => {
    const resMonitor = await app.fetch(new Request('http://localhost/monitor'), {
      redirect: 'manual',
    })
    expect(resMonitor.status).toBe(302)
    expect(resMonitor.headers.get('location')).toBe('/dashboard')

    const resStatus = await app.fetch(new Request('http://localhost/status'), {
      redirect: 'manual',
    })
    expect(resStatus.status).toBe(302)
    expect(resStatus.headers.get('location')).toBe('/dashboard')
  })
})
