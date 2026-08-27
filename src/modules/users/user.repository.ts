import { type User, type Prisma, Role, UserStatus } from '@prisma/client'
import { prisma } from '@/db/prisma'
import { parseSorting, parseSearch, parseDateRange } from '@/shared/utils/query.util'
import { USER_SORTABLE_FIELDS, type UserSortableField } from './user.dto'
import type { SortOrder } from '@/shared/types/pagination.type'

export interface FindAllUsersParams {
  skip?: number
  take?: number
  role?: Role
  status?: UserStatus
  search?: string
  sortBy?: UserSortableField
  sortOrder?: SortOrder
  startDate?: string
  endDate?: string
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(params: FindAllUsersParams): Promise<User[]>
  count(params: FindAllUsersParams): Promise<number>
  create(data: Prisma.UserCreateInput): Promise<User>
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>
  softDelete(id: string): Promise<User>
}

export class UserRepository implements IUserRepository {
  private buildWhereClause(params: FindAllUsersParams): Prisma.UserWhereInput {
    const searchCondition = parseSearch(params.search, ['firstName', 'lastName', 'email', 'phoneNumber'])
    const dateCondition = parseDateRange(params.startDate, params.endDate, 'createdAt')

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.role && { role: params.role }),
      ...(params.status && { status: params.status }),
      ...searchCondition,
      ...dateCondition,
    }

    return where
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    })
  }

  async findAll(params: FindAllUsersParams): Promise<User[]> {
    const where = this.buildWhereClause(params)
    const orderBy = parseSorting<UserSortableField>(
      { sortBy: params.sortBy, sortOrder: params.sortOrder },
      USER_SORTABLE_FIELDS,
      'createdAt',
      'desc'
    )

    return prisma.user.findMany({
      where,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy,
    })
  }

  async count(params: FindAllUsersParams): Promise<number> {
    const where = this.buildWhereClause(params)
    return prisma.user.count({ where })
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data })
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

export const userRepository = new UserRepository()
