import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody, validateQuery, validateParam } from '@/middlewares/validate.middleware'
import { errorHandler } from '@/middlewares/error.middleware'

const sampleBodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  age: z.number().int().min(0, 'Age must be non-negative').optional(),
})

const sampleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  role: z.enum(['ADMIN', 'DOCTOR', 'NURSE']).optional(),
})

const sampleParamSchema = z.object({
  id: z.string().uuid('ID must be a valid UUID'),
})

describe('Request Validation Middleware & Field Error Formatting', () => {
  const app = new Hono()
  app.onError(errorHandler)

  app.post('/test/body', validateBody(sampleBodySchema), (c) => {
    const data = c.get('validatedBody')
    return c.json({ success: true, data })
  })

  app.get('/test/query', validateQuery(sampleQuerySchema), (c) => {
    const query = c.get('validatedQuery')
    return c.json({ success: true, query })
  })

  app.get('/test/param/:id', validateParam(sampleParamSchema), (c) => {
    const param = c.get('validatedParam')
    return c.json({ success: true, param })
  })

  it('should accept valid request body', async () => {
    const res = await app.fetch(
      new Request('http://localhost/test/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', email: 'alice@hospital.org', age: 30 }),
      })
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('Alice')
  })

  it('should reject invalid request body with 400 and structured field-level errors', async () => {
    const res = await app.fetch(
      new Request('http://localhost/test/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'A', email: 'invalid-email', age: -5 }),
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.status).toBe(400)
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.errors).toBeDefined()
    expect(json.errors.length).toBe(3)

    const nameErr = json.errors.find((e: any) => e.field === 'name')
    expect(nameErr?.message).toContain('Name must be at least 2 characters')

    const emailErr = json.errors.find((e: any) => e.field === 'email')
    expect(emailErr?.message).toContain('Invalid email address format')

    const ageErr = json.errors.find((e: any) => e.field === 'age')
    expect(ageErr?.message).toContain('Age must be non-negative')
  })

  it('should reject malformed JSON body with 400 INVALID_JSON_BODY', async () => {
    const res = await app.fetch(
      new Request('http://localhost/test/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "invalidJson": ',
      })
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('INVALID_JSON_BODY')
    expect(json.message).toContain('Malformed JSON')
  })

  it('should accept valid query params with coerced defaults', async () => {
    const res = await app.fetch(new Request('http://localhost/test/query?page=3&role=DOCTOR'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.query.page).toBe(3)
    expect(json.query.role).toBe('DOCTOR')
  })

  it('should reject invalid query params with 400 VALIDATION_ERROR', async () => {
    const res = await app.fetch(new Request('http://localhost/test/query?page=-1&role=UNKNOWN_ROLE'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.errors.length).toBeGreaterThan(0)
  })

  it('should accept valid route param (UUID)', async () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000'
    const res = await app.fetch(new Request(`http://localhost/test/param/${validUuid}`))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.param.id).toBe(validUuid)
  })

  it('should reject invalid route param with 400 VALIDATION_ERROR', async () => {
    const res = await app.fetch(new Request('http://localhost/test/param/not-a-uuid'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.errors[0].field).toBe('id')
  })
})
