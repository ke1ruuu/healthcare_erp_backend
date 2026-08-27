import type { ErrorHandler, NotFoundHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { env } from '@/config/env'
import { AppException } from '@/shared/exceptions/app.exception'
import { formatZodIssues } from './validate.middleware'
import type { ApiErrorResponse, FieldErrorDetail } from '@/shared/types/response.type'

export const errorHandler: ErrorHandler = (err, c) => {
  const timestamp = new Date().toISOString()
  const path = c.req.path
  const requestId = c.get('requestId')

  // 1. Custom Domain / Application Exceptions
  if (err instanceof AppException) {
    const payload: ApiErrorResponse = {
      success: false,
      status: err.status,
      code: err.code,
      message: err.message,
      ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
      ...(requestId && { requestId }),
      timestamp,
      path,
    }
    return c.json(payload, err.status)
  }

  // 2. Direct Zod Validation Errors
  if (err instanceof ZodError) {
    const fieldErrors: FieldErrorDetail[] = formatZodIssues(err)
    const payload: ApiErrorResponse = {
      success: false,
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      errors: fieldErrors,
      ...(requestId && { requestId }),
      timestamp,
      path,
    }
    return c.json(payload, 400)
  }

  // 3. Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field'
      const payload: ApiErrorResponse = {
        success: false,
        status: 409,
        code: 'DUPLICATE_RESOURCE',
        message: `Unique constraint violation on ${target}`,
        ...(requestId && { requestId }),
        timestamp,
        path,
      }
      return c.json(payload, 409)
    }

    if (err.code === 'P2025') {
      const payload: ApiErrorResponse = {
        success: false,
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'The requested database record was not found',
        ...(requestId && { requestId }),
        timestamp,
        path,
      }
      return c.json(payload, 404)
    }

    if (err.code === 'P2003') {
      const payload: ApiErrorResponse = {
        success: false,
        status: 400,
        code: 'FOREIGN_KEY_CONSTRAINT_FAILED',
        message: 'Invalid reference to a related resource',
        ...(requestId && { requestId }),
        timestamp,
        path,
      }
      return c.json(payload, 400)
    }
  }

  // 4. Hono Standard HTTP Exceptions
  if (err instanceof HTTPException) {
    const payload: ApiErrorResponse = {
      success: false,
      status: err.status,
      code: `HTTP_${err.status}`,
      message: err.message,
      ...(requestId && { requestId }),
      timestamp,
      path,
    }
    return c.json(payload, err.status)
  }

  // 5. Uncaught Internal Server Errors
  if (env.NODE_ENV !== 'test') {
    console.error(`[Unhandled Error] [${requestId || '-'}] ${c.req.method} ${path}:`, err)
  }
  const isDev = env.NODE_ENV === 'development'

  const payload: ApiErrorResponse = {
    success: false,
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: isDev ? err.message || 'Internal Server Error' : 'Internal Server Error',
    ...(requestId && { requestId }),
    timestamp,
    path,
    ...(isDev && { stack: err.stack }),
  }

  return c.json(payload, 500)
}

export const notFoundHandler: NotFoundHandler = (c) => {
  const requestId = c.get('requestId')
  const payload: ApiErrorResponse = {
    success: false,
    status: 404,
    code: 'RESOURCE_NOT_FOUND',
    message: `Route not found: ${c.req.method} ${c.req.path}`,
    ...(requestId && { requestId }),
    timestamp: new Date().toISOString(),
    path: c.req.path,
  }
  return c.json(payload, 404)
}
