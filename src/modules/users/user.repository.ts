import { type User, type Prisma, Role, UserStatus } from '@prisma/client'
import { prisma } from '@/db/prisma'

export interface FindAllUsersParams {
  skip?: number
  take?: number
  role?: Role
  status?: UserStatus
  search?: string
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
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    }

    if (params.role) {
      where.role = params.role
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ]
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
    return prisma.user.findMany({
      where,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy: { createdAt: 'desc' },
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
