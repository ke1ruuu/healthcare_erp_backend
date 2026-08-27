import type { User, Prisma } from '@prisma/client'
import {
  type IUserRepository,
  userRepository,
} from './user.repository'
import {
  type IAuditLogRepository,
  auditLogRepository,
} from '@/modules/audit-logs'
import { NotFoundException, ConflictException } from '@/shared/exceptions/app.exception'
import { parsePagination, buildPaginationMeta } from '@/shared/utils/query.util'
import type { PaginationMeta } from '@/shared/types/pagination.type'
import type {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  UserResponseDto,
} from './user.dto'

export class UserService {
  constructor(
    private readonly userRepo: IUserRepository = userRepository,
    private readonly auditRepo: IAuditLogRepository = auditLogRepository
  ) {}

  private sanitizeUser(user: User): UserResponseDto {
    const { passwordHash: _, deletedAt: __, ...sanitized } = user
    return sanitized
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id)
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }
    return this.sanitizeUser(user)
  }

  async listUsers(query: UserQueryDto): Promise<{
    users: UserResponseDto[]
    meta: PaginationMeta
  }> {
    const { skip, take, page, limit } = parsePagination(query)

    const [users, total] = await Promise.all([
      this.userRepo.findAll({
        skip,
        take,
        role: query.role,
        status: query.status,
        search: query.search,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any,
        startDate: query.startDate,
        endDate: query.endDate,
      }),
      this.userRepo.count({
        role: query.role,
        status: query.status,
        search: query.search,
        startDate: query.startDate,
        endDate: query.endDate,
      }),
    ])

    return {
      users: users.map((user) => this.sanitizeUser(user)),
      meta: buildPaginationMeta(total, page, limit),
    }
  }

  async createUser(data: CreateUserDto, actorId?: string): Promise<UserResponseDto> {
    const existing = await this.userRepo.findByEmail(data.email)
    if (existing) {
      throw new ConflictException('A user with this email address already exists')
    }

    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 10,
    })

    const createInput: Prisma.UserCreateInput = {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      status: data.status,
      phoneNumber: data.phoneNumber,
      avatarUrl: data.avatarUrl,
    }

    const user = await this.userRepo.create(createInput)

    // Audit Logging
    await this.auditRepo.create({
      userId: actorId ?? null,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })

    return this.sanitizeUser(user)
  }

  async updateUser(
    id: string,
    data: UpdateUserDto,
    actorId?: string
  ): Promise<UserResponseDto> {
    const existing = await this.userRepo.findById(id)
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }

    if (data.email && data.email !== existing.email) {
      const emailInUse = await this.userRepo.findByEmail(data.email)
      if (emailInUse) {
        throw new ConflictException('A user with this email address already exists')
      }
    }

    const updateInput: Prisma.UserUpdateInput = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email && { email: data.email }),
      ...(data.role && { role: data.role }),
      ...(data.status && { status: data.status }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    }

    if (data.password) {
      updateInput.passwordHash = await Bun.password.hash(data.password, {
        algorithm: 'bcrypt',
        cost: 10,
      })
    }

    const updatedUser = await this.userRepo.update(id, updateInput)

    // Audit Logging
    await this.auditRepo.create({
      userId: actorId ?? null,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: updatedUser.id,
      details: { updatedFields: Object.keys(data) },
    })

    return this.sanitizeUser(updatedUser)
  }

  async deleteUser(id: string, actorId?: string): Promise<void> {
    const existing = await this.userRepo.findById(id)
    if (!existing) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }

    await this.userRepo.softDelete(id)

    // Audit Logging
    await this.auditRepo.create({
      userId: actorId ?? null,
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id,
    })
  }
}

export const userService = new UserService()
