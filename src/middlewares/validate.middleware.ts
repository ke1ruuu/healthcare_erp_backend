import type { MiddlewareHandler } from 'hono'
import { ZodError, type ZodSchema } from 'zod'
import { ValidationException, BadRequestException } from '@/shared/exceptions/app.exception'
import type { FieldErrorDetail } from '@/shared/types/response.type'

export function formatZodIssues(error: ZodError): FieldErrorDetail[] {
  return error.errors.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
    message: issue.message,
    code: issue.code,
  }))
}

export function validateBody<T>(schema: ZodSchema<T>): MiddlewareHandler {
  return async (c, next) => {
    let rawBody: unknown

    try {
      rawBody = await c.req.json()
    } catch {
      throw new BadRequestException(
        'Malformed JSON: Unable to parse request body',
        'INVALID_JSON_BODY'
      )
    }

    const result = schema.safeParse(rawBody)

    if (!result.success) {
      const fieldErrors = formatZodIssues(result.error)
      throw new ValidationException('Request body validation failed', fieldErrors)
    }

    c.set('validatedBody', result.data)
    await next()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>): MiddlewareHandler {
  return async (c, next) => {
    const rawQuery = c.req.query()
    const result = schema.safeParse(rawQuery)

    if (!result.success) {
      const fieldErrors = formatZodIssues(result.error)
      throw new ValidationException('Query parameter validation failed', fieldErrors)
    }

    c.set('validatedQuery', result.data)
    await next()
  }
}

export function validateParam<T>(schema: ZodSchema<T>): MiddlewareHandler {
  return async (c, next) => {
    const rawParam = c.req.param()
    const result = schema.safeParse(rawParam)

    if (!result.success) {
      const fieldErrors = formatZodIssues(result.error)
      throw new ValidationException('Route parameter validation failed', fieldErrors)
    }

    c.set('validatedParam', result.data)
    await next()
  }
}
