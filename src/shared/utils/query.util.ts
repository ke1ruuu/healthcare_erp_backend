import type {
  BaseQueryDto,
  PaginationMeta,
  ParsedPagination,
  ParsedSorting,
  SortOrder,
} from '@/shared/types/pagination.type'

export function parsePagination(query: Partial<Pick<BaseQueryDto, 'page' | 'limit'>>): ParsedPagination {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
  const skip = (page - 1) * limit
  const take = limit

  return { skip, take, page, limit }
}

export function parseSorting<T extends string>(
  query: Partial<Pick<BaseQueryDto, 'sortBy' | 'sortOrder'>>,
  allowedFields: readonly T[],
  defaultField: T = allowedFields[0],
  defaultOrder: SortOrder = 'desc'
): ParsedSorting {
  const requestedField = query.sortBy as T | undefined
  const field: T = requestedField && allowedFields.includes(requestedField) ? requestedField : defaultField

  const requestedOrder = query.sortOrder?.toLowerCase()
  const order: SortOrder = requestedOrder === 'asc' || requestedOrder === 'desc' ? requestedOrder : defaultOrder

  return { [field]: order }
}

export function parseSearch(
  search: string | undefined,
  searchFields: readonly string[]
): Record<string, any> {
  const trimmed = search?.trim()
  if (!trimmed || searchFields.length === 0) return {}

  return {
    OR: searchFields.map((field) => ({
      [field]: {
        contains: trimmed,
        mode: 'insensitive',
      },
    })),
  }
}

export function parseDateRange(
  startDate?: string,
  endDate?: string,
  dateField = 'createdAt'
): Record<string, any> {
  const dateFilter: Record<string, Date> = {}

  if (startDate) {
    const start = new Date(startDate)
    if (!isNaN(start.getTime())) {
      dateFilter.gte = start
    }
  }

  if (endDate) {
    const end = new Date(endDate)
    if (!isNaN(end.getTime())) {
      // If only YYYY-MM-DD was provided, extend to end of that day (23:59:59.999)
      if (endDate.length === 10) {
        end.setUTCHours(23, 59, 59, 999)
      }
      dateFilter.lte = end
    }
  }

  if (Object.keys(dateFilter).length === 0) {
    return {}
  }

  return { [dateField]: dateFilter }
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const safeTotal = Math.max(0, total)
  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, limit)
  const totalPages = Math.ceil(safeTotal / safeLimit) || 1

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  }
}
