import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware'
import {
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  ValidationException,
  UnprocessableEntityException,
} from '@/shared/exceptions/app.exception'

describe('Global Error Handling & Error Envelope Formatting', () => {
  const app = new Hono()
  app.onError(errorHandler)
  app.notFound(notFoundHandler)

  app.get('/error/not-found', () => {
    throw new NotFoundException('Patient record not found')
  })

  app.get('/error/conflict', () => {
    throw new ConflictException('A user with this email already exists')
  })

  app.get('/error/unauthorized', () => {
    throw new UnauthorizedException('Missing bearer authentication token')
  })

  app.get('/error/forbidden', () => {
    throw new ForbiddenException('Doctor privileges required')
  })

  app.get('/error/validation', () => {
    throw new ValidationException('Validation failed', [
      { field: 'email', message: 'Email must be valid', code: 'invalid_string' },
    ])
  })

  app.get('/error/unprocessable', () => {
    throw new UnprocessableEntityException('Cannot process insurance claim')
  })

  app.get('/error/uncaught', () => {
    throw new Error('Unexpected crash!')
  })

  it('should format NotFoundException as standard 404 envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/error/not-found'))
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.status).toBe(404)
    expect(json.code).toBe('RESOURCE_NOT_FOUND')
    expect(json.message).toBe('Patient record not found')
    expect(json.timestamp).toBeDefined()
    expect(json.path).toBe('/error/not-found')
  })

  it('should format ConflictException as standard 409 envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/error/conflict'))
    expect(res.status).toBe(409)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.status).toBe(409)
    expect(json.code).toBe('CONFLICT')
    expect(json.message).toContain('already exists')
  })

  it('should format UnauthorizedException as standard 401 envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/error/unauthorized'))
    expect(res.status).toBe(401)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('UNAUTHORIZED')
  })

  it('should format ForbiddenException as standard 403 envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/error/forbidden'))
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('FORBIDDEN')
  })

  it('should format ValidationException with field error list', async () => {
    const res = await app.fetch(new Request('http://localhost/error/validation'))
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('VALIDATION_ERROR')
    expect(json.errors).toBeDefined()
    expect(json.errors[0].field).toBe('email')
  })

  it('should format UnprocessableEntityException as 422 envelope', async () => {
    const res = await app.fetch(new Request('http://localhost/error/unprocessable'))
    expect(res.status).toBe(422)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe('UNPROCESSABLE_ENTITY')
  })

  it('should handle uncaught exceptions as 500 INTERNAL_SERVER_ERROR', async () => {
    const res = await app.fetch(new Request('http://localhost/error/uncaught'))
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.status).toBe(500)
    expect(json.code).toBe('INTERNAL_SERVER_ERROR')
  })

  it('should format 404 Route Not Found via notFoundHandler', async () => {
    const res = await app.fetch(new Request('http://localhost/non-existent-path'))
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.status).toBe(404)
    expect(json.code).toBe('RESOURCE_NOT_FOUND')
    expect(json.message).toContain('Route not found')
    expect(json.path).toBe('/non-existent-path')
  })
})
