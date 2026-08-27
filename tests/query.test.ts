import { describe, expect, it } from 'bun:test'
import {
  parsePagination,
  parseSorting,
  parseSearch,
  parseDateRange,
  buildPaginationMeta,
} from '@/shared/utils/query.util'

describe('Pagination, Filtering, Sorting & Searching Utilities', () => {
  describe('parsePagination', () => {
    it('should return default pagination when no params are provided', () => {
      const parsed = parsePagination({})
      expect(parsed.page).toBe(1)
      expect(parsed.limit).toBe(20)
      expect(parsed.skip).toBe(0)
      expect(parsed.take).toBe(20)
    })

    it('should compute correct skip and take for page 3 with limit 15', () => {
      const parsed = parsePagination({ page: 3, limit: 15 })
      expect(parsed.page).toBe(3)
      expect(parsed.limit).toBe(15)
      expect(parsed.skip).toBe(30)
      expect(parsed.take).toBe(15)
    })

    it('should clamp limit to max 100', () => {
      const parsed = parsePagination({ page: 1, limit: 500 })
      expect(parsed.limit).toBe(100)
      expect(parsed.take).toBe(100)
    })

    it('should handle zero or negative page values gracefully', () => {
      const parsed = parsePagination({ page: -5, limit: -10 })
      expect(parsed.page).toBe(1)
      expect(parsed.limit).toBe(1)
      expect(parsed.skip).toBe(0)
    })
  })

  describe('parseSorting', () => {
    const allowed = ['createdAt', 'lastName', 'email'] as const

    it('should parse valid sortBy and sortOrder', () => {
      const sort = parseSorting({ sortBy: 'lastName', sortOrder: 'asc' }, allowed)
      expect(sort).toEqual({ lastName: 'asc' })
    })

    it('should normalize uppercase sortOrder', () => {
      const sort = parseSorting({ sortBy: 'email', sortOrder: 'DESC' as any }, allowed)
      expect(sort).toEqual({ email: 'desc' })
    })

    it('should fallback to defaultField when sortBy is invalid', () => {
      const sort = parseSorting({ sortBy: 'injectedField', sortOrder: 'asc' }, allowed, 'createdAt', 'desc')
      expect(sort).toEqual({ createdAt: 'asc' })
    })

    it('should fallback to defaultOrder when sortOrder is invalid', () => {
      const sort = parseSorting({ sortBy: 'email', sortOrder: 'invalid_order' as any }, allowed, 'createdAt', 'desc')
      expect(sort).toEqual({ email: 'desc' })
    })
  })

  describe('parseSearch', () => {
    it('should generate Prisma OR conditions for search term', () => {
      const condition = parseSearch('john', ['firstName', 'lastName', 'email'])
      expect(condition).toEqual({
        OR: [
          { firstName: { contains: 'john', mode: 'insensitive' } },
          { lastName: { contains: 'john', mode: 'insensitive' } },
          { email: { contains: 'john', mode: 'insensitive' } },
        ],
      })
    })

    it('should return empty object for undefined or empty whitespace search', () => {
      expect(parseSearch(undefined, ['firstName'])).toEqual({})
      expect(parseSearch('   ', ['firstName'])).toEqual({})
      expect(parseSearch('john', [])).toEqual({})
    })
  })

  describe('parseDateRange', () => {
    it('should parse ISO date range', () => {
      const start = '2026-01-01T00:00:00.000Z'
      const end = '2026-01-31T23:59:59.999Z'
      const filter = parseDateRange(start, end, 'createdAt')

      expect(filter.createdAt).toBeDefined()
      expect(filter.createdAt.gte).toEqual(new Date(start))
      expect(filter.createdAt.lte).toEqual(new Date(end))
    })

    it('should extend YYYY-MM-DD endDate to end of day', () => {
      const filter = parseDateRange('2026-05-01', '2026-05-15', 'registeredAt')
      expect(filter.registeredAt.gte).toEqual(new Date('2026-05-01'))
      expect(filter.registeredAt.lte.getUTCHours()).toBe(23)
      expect(filter.registeredAt.lte.getUTCMinutes()).toBe(59)
      expect(filter.registeredAt.lte.getUTCSeconds()).toBe(59)
    })

    it('should return empty object if dates are missing or invalid', () => {
      expect(parseDateRange(undefined, undefined)).toEqual({})
      expect(parseDateRange('invalid-date', 'not-a-date')).toEqual({})
    })
  })

  describe('buildPaginationMeta', () => {
    it('should calculate pagination metadata correctly for multiple pages', () => {
      const meta = buildPaginationMeta(55, 2, 20)
      expect(meta.page).toBe(2)
      expect(meta.limit).toBe(20)
      expect(meta.total).toBe(55)
      expect(meta.totalPages).toBe(3)
      expect(meta.hasNextPage).toBe(true)
      expect(meta.hasPreviousPage).toBe(true)
    })

    it('should calculate pagination metadata for first and only page', () => {
      const meta = buildPaginationMeta(8, 1, 20)
      expect(meta.totalPages).toBe(1)
      expect(meta.hasNextPage).toBe(false)
      expect(meta.hasPreviousPage).toBe(false)
    })

    it('should calculate pagination metadata for last page', () => {
      const meta = buildPaginationMeta(40, 2, 20)
      expect(meta.totalPages).toBe(2)
      expect(meta.hasNextPage).toBe(false)
      expect(meta.hasPreviousPage).toBe(true)
    })

    it('should handle zero total items', () => {
      const meta = buildPaginationMeta(0, 1, 20)
      expect(meta.total).toBe(0)
      expect(meta.totalPages).toBe(1)
      expect(meta.hasNextPage).toBe(false)
      expect(meta.hasPreviousPage).toBe(false)
    })
  })
})
