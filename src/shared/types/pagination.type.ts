import { z } from 'zod'

export const sortOrderSchema = z.enum(['asc', 'desc', 'ASC', 'DESC']).default('desc')

export const baseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().trim().optional(),
  sortOrder: sortOrderSchema.optional(),
  search: z.string().trim().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})

export type BaseQueryDto = z.infer<typeof baseQuerySchema>
export type SortOrder = 'asc' | 'desc'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ParsedPagination {
  skip: number
  take: number
  page: number
  limit: number
}

export interface ParsedSorting {
  [field: string]: 'asc' | 'desc'
}
