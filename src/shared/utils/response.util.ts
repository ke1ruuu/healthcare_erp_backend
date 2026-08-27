import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { PaginationMeta } from '@/shared/types/pagination.type'
import type {
  ApiSuccessResponse,
  ApiPaginatedResponse,
  ApiErrorResponse,
  FieldErrorDetail,
} from '@/shared/types/response.type'

export const sendSuccess = <T>(
  c: Context,
  data: T,
  message?: string,
  status: ContentfulStatusCode = 200
) => {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  }
  return c.json(payload, status)
}

export const sendCreated = <T>(
  c: Context,
  data: T,
  message = 'Resource created successfully'
) => {
  return sendSuccess(c, data, message, 201)
}

export const sendPaginated = <T>(
  c: Context,
  data: T[],
  meta: PaginationMeta,
  message?: string
) => {
  const payload: ApiPaginatedResponse<T> = {
    success: true,
    data,
    meta,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  }
  return c.json(payload, 200)
}

export const sendNoContent = (c: Context, message = 'Operation completed successfully') => {
  return c.json(
    {
      success: true,
      message,
      timestamp: new Date().toISOString(),
    },
    200
  )
}

export const sendError = (
  c: Context,
  status: ContentfulStatusCode = 500,
  message = 'An error occurred',
  code = 'INTERNAL_ERROR',
  errors?: FieldErrorDetail[]
) => {
  const payload: ApiErrorResponse = {
    success: false,
    status,
    code,
    message,
    ...(errors && errors.length > 0 && { errors }),
    timestamp: new Date().toISOString(),
    path: c.req.path,
  }
  return c.json(payload, status)
}
