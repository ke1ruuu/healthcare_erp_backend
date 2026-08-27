import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { FieldErrorDetail } from '@/shared/types/response.type'

export class AppException extends Error {
  public readonly status: ContentfulStatusCode
  public readonly code: string
  public readonly errors?: FieldErrorDetail[]

  constructor(
    message: string,
    status: ContentfulStatusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    errors?: FieldErrorDetail[]
  ) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.errors = errors
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationException extends AppException {
  constructor(message = 'Request validation failed', errors?: FieldErrorDetail[]) {
    super(message, 400, 'VALIDATION_ERROR', errors)
  }
}

export class BadRequestException extends AppException {
  constructor(message = 'Bad request', code = 'BAD_REQUEST', errors?: FieldErrorDetail[]) {
    super(message, 400, code, errors)
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, 401, code)
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Access forbidden: Insufficient permissions', code = 'FORBIDDEN') {
    super(message, 403, code)
  }
}

export class NotFoundException extends AppException {
  constructor(message = 'Requested resource not found', code = 'RESOURCE_NOT_FOUND') {
    super(message, 404, code)
  }
}

export class ConflictException extends AppException {
  constructor(message = 'Resource conflict or duplicate entry', code = 'CONFLICT') {
    super(message, 409, code)
  }
}

export class UnprocessableEntityException extends AppException {
  constructor(
    message = 'Unprocessable entity',
    code = 'UNPROCESSABLE_ENTITY',
    errors?: FieldErrorDetail[]
  ) {
    super(message, 422, code, errors)
  }
}

export class InternalServerException extends AppException {
  constructor(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
    super(message, 500, code)
  }
}
