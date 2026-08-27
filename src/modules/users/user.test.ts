import { describe, expect, it } from 'bun:test'
import { UserService } from './user.service'
import type { IUserRepository, FindAllUsersParams } from './user.repository'
import type { IAuditLogRepository } from '@/modules/audit-logs'
import { Role, UserStatus, type User, type Prisma } from '@prisma/client'
import { NotFoundException, ConflictException } from '@/shared/exceptions/app.exception'
import { UserController } from './user.controller'
import { Hono } from 'hono'
import { errorHandler } from '@/middlewares/error.middleware'

// In-memory Mock Repository for Unit Testing
class MockUserRepository implements IUserRepository {
  private users: User[] = []

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id && u.deletedAt === null) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email && u.deletedAt === null) ?? null
  }

  async findAll(params: FindAllUsersParams): Promise<User[]> {
    let result = this.users.filter((u) => u.deletedAt === null)
    if (params.role) {
      result = result.filter((u) => u.role === params.role)
    }
    if (params.status) {
      result = result.filter((u) => u.status === params.status)
    }
    const skip = params.skip ?? 0
    const take = params.take ?? 20
    return result.slice(skip, skip + take)
  }

  async count(params: FindAllUsersParams): Promise<number> {
    const all = await this.findAll(params)
    return all.length
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const user: User = {
      id: `mock-uuid-${this.users.length + 1}`,
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: (data.role as Role) ?? Role.RECEPTIONIST,
      status: (data.status as UserStatus) ?? UserStatus.ACTIVE,
      phoneNumber: data.phoneNumber ?? null,
      avatarUrl: data.avatarUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }
    this.users.push(user)
    return user
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('Not found')
    this.users[idx] = {
      ...this.users[idx],
      ...(data.firstName && { firstName: data.firstName as string }),
      ...(data.lastName && { lastName: data.lastName as string }),
      ...(data.email && { email: data.email as string }),
      ...(data.role && { role: data.role as Role }),
      updatedAt: new Date(),
    }
    return this.users[idx]
  }

  async softDelete(id: string): Promise<User> {
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx === -1) throw new Error('Not found')
    this.users[idx].deletedAt = new Date()
    return this.users[idx]
  }
}

class MockAuditLogRepository implements IAuditLogRepository {
  async create(): Promise<void> {
    // In-memory no-op
  }
}

describe('Users Domain Module - Application Service (Unit Tests)', () => {
  it('should create a user, hash password, and omit passwordHash from response', async () => {
    const mockRepo = new MockUserRepository()
    const mockAudit = new MockAuditLogRepository()
    const service = new UserService(mockRepo, mockAudit)

    const result = await service.createUser({
      email: 'doctor.test@hospital.org',
      password: 'SecurePassword123!',
      firstName: 'Gregory',
      lastName: 'House',
      role: Role.DOCTOR,
      status: UserStatus.ACTIVE,
    })

    expect(result.id).toBeDefined()
    expect(result.email).toBe('doctor.test@hospital.org')
    expect(result.firstName).toBe('Gregory')
    expect(result.lastName).toBe('House')
    expect(result.role).toBe(Role.DOCTOR)
    // Ensure sensitive fields are omitted
    expect((result as unknown as Record<string, unknown>).passwordHash).toBeUndefined()
    expect((result as unknown as Record<string, unknown>).deletedAt).toBeUndefined()
  })

  it('should throw 409 Conflict when creating a user with existing email', async () => {
    const mockRepo = new MockUserRepository()
    const mockAudit = new MockAuditLogRepository()
    const service = new UserService(mockRepo, mockAudit)

    await service.createUser({
      email: 'duplicate@hospital.org',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.NURSE,
      status: UserStatus.ACTIVE,
    })

    await expect(
      service.createUser({
        email: 'duplicate@hospital.org',
        password: 'AnotherPassword123!',
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.NURSE,
        status: UserStatus.ACTIVE,
      })
    ).rejects.toThrow(ConflictException)
  })

  it('should throw 404 Not Found when retrieving non-existent user', async () => {
    const mockRepo = new MockUserRepository()
    const mockAudit = new MockAuditLogRepository()
    const service = new UserService(mockRepo, mockAudit)

    await expect(service.getUserById('non-existent-id')).rejects.toThrow(NotFoundException)
  })

  it('should list users with pagination metadata', async () => {
    const mockRepo = new MockUserRepository()
    const mockAudit = new MockAuditLogRepository()
    const service = new UserService(mockRepo, mockAudit)

    await service.createUser({
      email: 'user1@hospital.org',
      password: 'Password123!',
      firstName: 'Alice',
      lastName: 'Smith',
      role: Role.DOCTOR,
      status: UserStatus.ACTIVE,
    })

    await service.createUser({
      email: 'user2@hospital.org',
      password: 'Password123!',
      firstName: 'Bob',
      lastName: 'Jones',
      role: Role.PHARMACIST,
      status: UserStatus.ACTIVE,
    })

    const result = await service.listUsers({ page: 1, limit: 10 })
    expect(result.users.length).toBe(2)
    expect(result.meta.total).toBe(2)
    expect(result.meta.page).toBe(1)
    expect(result.meta.limit).toBe(10)
  })
})

describe('Users Domain Module - Controller & API Routes (Integration Tests)', () => {
  it('should handle full HTTP lifecycle (POST, GET, PATCH, DELETE) with standard response envelope', async () => {
    const mockRepo = new MockUserRepository()
    const mockAudit = new MockAuditLogRepository()
    const service = new UserService(mockRepo, mockAudit)
    const controller = new UserController(service)

    const app = new Hono()
    app.onError(errorHandler)
    app.post('/users', (c) => controller.createUser(c))
    app.get('/users', (c) => controller.listUsers(c))
    app.get('/users/:id', (c) => controller.getUser(c))
    app.patch('/users/:id', (c) => controller.updateUser(c))
    app.delete('/users/:id', (c) => controller.deleteUser(c))

    // 1. Create User via POST /users
    const createRes = await app.fetch(
      new Request('http://localhost/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin.unit@hospital.org',
          password: 'AdminPassword123!',
          firstName: 'Hospital',
          lastName: 'Director',
          role: 'ADMIN',
          status: 'ACTIVE',
        }),
      })
    )

    expect(createRes.status).toBe(201)
    const createBody = await createRes.json()
    expect(createBody.success).toBe(true)
    expect(createBody.data.email).toBe('admin.unit@hospital.org')
    const userId = createBody.data.id

    // 2. Get User via GET /users/:id
    const getRes = await app.fetch(new Request(`http://localhost/users/${userId}`))
    expect(getRes.status).toBe(200)
    const getBody = await getRes.json()
    expect(getBody.success).toBe(true)
    expect(getBody.data.id).toBe(userId)

    // 3. Update User via PATCH /users/:id
    const updateRes = await app.fetch(
      new Request(`http://localhost/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Chief',
        }),
      })
    )
    expect(updateRes.status).toBe(200)
    const updateBody = await updateRes.json()
    expect(updateBody.data.firstName).toBe('Chief')

    // 4. Delete User via DELETE /users/:id
    const deleteRes = await app.fetch(
      new Request(`http://localhost/users/${userId}`, {
        method: 'DELETE',
      })
    )
    expect(deleteRes.status).toBe(200)
    const deleteBody = await deleteRes.json()
    expect(deleteBody.success).toBe(true)

    // 5. Verify 404 after soft deletion
    const getDeletedRes = await app.fetch(new Request(`http://localhost/users/${userId}`))
    expect(getDeletedRes.status).toBe(404)
  })
})
