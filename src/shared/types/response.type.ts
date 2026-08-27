import type { PaginationMeta } from './pagination.type'

export interface FieldErrorDetail {
  field: string
  message: string
  code?: string
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
  meta?: PaginationMeta
  requestId?: string
  timestamp?: string
}

export interface ApiPaginatedResponse<T> {
  success: true
  data: T[]
  meta: PaginationMeta
  message?: string
  requestId?: string
  timestamp?: string
}

export interface ApiErrorResponse {
  success: false
  status: number
  code: string
  message: string
  errors?: FieldErrorDetail[]
  requestId?: string
  timestamp: string
  path?: string
  stack?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiPaginatedResponse<T> | ApiErrorResponse

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
    validatedBody: any
    validatedQuery: any
    validatedParam: any
    user?: { id?: string; email?: string; role?: string }
  }
}
