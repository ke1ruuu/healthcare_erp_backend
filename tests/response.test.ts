import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
  sendError,
} from '@/shared/utils/response.util'

describe('Standardized Response Formatting Utilities', () => {
  const app = new Hono()

  app.get('/success', (c) => sendSuccess(c, { user: 'John Doe' }, 'Fetched user'))
  app.post('/created', (c) => sendCreated(c, { id: 'patient-123' }, 'Patient record created'))
  app.get('/paginated', (c) =>
    sendPaginated(c, [{ id: 1 }, { id: 2 }], {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })
  )
  app.delete('/no-content', (c) => sendNoContent(c, 'Resource deleted'))
  app.get('/custom-error', (c) =>
    sendError(c, 400, 'Custom error', 'CUSTOM_ERR', [{ field: 'code', message: 'Invalid code' }])
  )

  it('sendSuccess should return 200 with standard envelope and timestamp', async () => {
    const res = await app.fetch(new Request('http://localhost/success'))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.user).toBe('John Doe')
    expect(json.message).toBe('Fetched user')
    expect(json.timestamp).toBeDefined()
  })

  it('sendCreated should return 201 with standard envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/created', { method: 'POST' }))
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.id).toBe('patient-123')
    expect(json.message).toBe('Patient record created')
    expect(json.timestamp).toBeDefined()
  })

  it('sendPaginated should return 200 with data array and pagination metadata', async () => {
    const res = await app.fetch(new Request('http://localhost/paginated'))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBe(2)
    expect(json.meta.page).toBe(1)
    expect(json.meta.total).toBe(2)
    expect(json.meta.totalPages).toBe(1)
  })

  it('sendNoContent should return 200 with success confirmation', async () => {
    const res = await app.fetch(new Request('http://localhost/no-content', { method: 'DELETE' }))
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.message).toBe('Resource deleted')
  })

  it('sendError should return specified error status and envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/custom-error'))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.status).toBe(400)
    expect(json.code).toBe('CUSTOM_ERR')
    expect(json.message).toBe('Custom error')
    expect(json.errors[0].field).toBe('code')
  })
})
