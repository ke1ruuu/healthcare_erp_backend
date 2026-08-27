import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { PaginationMeta } from '@/shared/types/pagination.type'

export interface StandardSuccessResponse<T> {
  success: true
  data: T
  message?: string
  meta?: PaginationMeta
}

export const sendSuccess = <T>(
  c: Context,
  data: T,
  message?: string,
  status: ContentfulStatusCode = 200
) => {
  return c.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    status
  )
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
  return c.json(
    {
      success: true,
      data,
      meta,
      ...(message && { message }),
    },
    200
  )
}

export const sendNoContent = (c: Context, message = 'Operation completed successfully') => {
  return c.json(
    {
      success: true,
      message,
    },
    200
  )
}
