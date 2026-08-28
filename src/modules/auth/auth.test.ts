import { describe, expect, it, beforeEach } from 'bun:test'
import { Hono } from 'hono'
import { Role, UserStatus, OrganizationStatus, BranchStatus } from '@prisma/client'
import { AuthService } from './auth.service'
import { authRoute } from './auth.route'
import { prisma } from '@/db/prisma'
import type { IUserRepository } from '@/modules/users'
import type { ISessionRepository } from './session.repository'
import type { IAuditLogRepository } from '@/modules/audit-logs'
import { errorHandler } from '@/middlewares/error.middleware'
import {
  requireAuth,
  requireOrganization,
  requireTenantContext,
} from '@/middlewares/auth.middleware'
import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@/shared/exceptions/app.exception'

// In-memory mock repositories for Unit Tests
class MockUserRepository implements IUserRepository {
  users: Array<any> = []

  async findById(id: string) {
    const u = this.users.find((user) => user.id === id && user.deletedAt === null)
    return u || null
  }

  async findByEmail(email: string) {
    const u = this.users.find((user) => user.email === email && user.deletedAt === null)
    return u || null
  }

  async findAll() {
    return this.users.filter((u) => u.deletedAt === null)
  }

  async count() {
    return this.users.filter((u) => u.deletedAt === null).length
  }

  async create(data: any) {
    const user = {
      id: data.id || `user-${Date.now()}-${Math.random()}`,
      ...data,
      phoneNumber: data.phoneNumber || null,
      avatarUrl: data.avatarUrl || null,
      organization: data.organizationId
        ? {
            id: data.organizationId,
            name: 'Apex Health',
            code: 'ORG-APEX',
            status: OrganizationStatus.ACTIVE,
          }
        : null,
      branch: data.branchId
        ? {
            id: data.branchId,
            organizationId: data.organizationId || 'org-1',
            name: 'Main Campus',
            code: 'BR-MAIN',
            status: BranchStatus.ACTIVE,
          }
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }
    this.users.push(user)
    return user
  }

  async update(id: string, data: any) {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('User not found')
    Object.assign(user, data, { updatedAt: new Date() })
    return user
  }

  async softDelete(id: string) {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException('User not found')
    user.deletedAt = new Date()
    return user
  }
}

class MockSessionRepository implements ISessionRepository {
  sessions: Array<any> = []

  async createSession(data: any) {
    const session = {
      id: `sess-${Date.now()}-${Math.random()}`,
      ...data,
      createdAt: new Date(),
      revokedAt: null,
    }
    this.sessions.push(session)
    return session
  }

  async findByRefreshToken(token: string) {
    const sess = this.sessions.find((s) => s.refreshToken === token)
    if (!sess) return null
    return {
      ...sess,
      user: {
        id: sess.userId,
        email: 'doctor@hospital.org',
        firstName: 'John',
        lastName: 'Smith',
        role: Role.DOCTOR,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    }
  }

  async revokeSession(token: string) {
    const sess = this.sessions.find((s) => s.refreshToken === token)
    if (!sess) return null
    sess.revokedAt = new Date()
    return sess
  }

  async revokeAllUserSessions(userId: string) {
    let count = 0
    this.sessions.forEach((s) => {
      if (s.userId === userId && !s.revokedAt) {
        s.revokedAt = new Date()
        count++
      }
    })
    return count
  }

  async deleteExpiredSessions() {
    const initial = this.sessions.length
    this.sessions = this.sessions.filter((s) => s.expiresAt > new Date() && !s.revokedAt)
    return initial - this.sessions.length
  }
}

class MockAuditLogRepository implements IAuditLogRepository {
  logs: Array<any> = []

  async create(data: any) {
    const log = {
      id: `log-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    }
    this.logs.push(log)
    return log
  }

  async findMany() {
    return { data: this.logs, total: this.logs.length }
  }

  async findById(id: string) {
    return this.logs.find((l) => l.id === id) || null
  }
}

describe('Authentication Domain Module — Unit & Integration Tests', () => {
  describe('AuthService — Unit Tests (with Mock Repositories)', () => {
    let userRepo: MockUserRepository
    let sessionRepo: MockSessionRepository
    let auditRepo: MockAuditLogRepository
    let authService: AuthService
    let testPasswordHash: string

    beforeEach(async () => {
      userRepo = new MockUserRepository()
      sessionRepo = new MockSessionRepository()
      auditRepo = new MockAuditLogRepository()
      authService = new AuthService(userRepo, sessionRepo, auditRepo)

      testPasswordHash = await Bun.password.hash('Password@123', {
        algorithm: 'bcrypt',
        cost: 10,
      })

      // Seed test user
      await userRepo.create({
        id: 'usr-doctor-001',
        email: 'doctor@hospital.org',
        passwordHash: testPasswordHash,
        firstName: 'John',
        lastName: 'Smith',
        role: Role.DOCTOR,
        status: UserStatus.ACTIVE,
      })
    })

    it('should authenticate valid user, generate access/refresh tokens, and log audit event', async () => {
      const result = await authService.login({
        email: 'doctor@hospital.org',
        password: 'Password@123',
      })

      expect(result).toBeDefined()
      expect(result.user.email).toBe('doctor@hospital.org')
      expect(result.user.role).toBe(Role.DOCTOR)
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
      expect(result.tokens.tokenType).toBe('Bearer')
      expect(result.tokens.expiresIn).toBe(900)

      expect(sessionRepo.sessions.length).toBe(1)
      expect(auditRepo.logs.some((l) => l.action === 'USER_LOGIN')).toBe(true)
    })

    it('should throw 401 Unauthorized for invalid password', async () => {
      await expect(
        authService.login({
          email: 'doctor@hospital.org',
          password: 'WrongPassword!',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw 401 Unauthorized for non-existent email', async () => {
      await expect(
        authService.login({
          email: 'nobody@hospital.org',
          password: 'Password@123',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw 403 Forbidden for suspended user', async () => {
      await userRepo.create({
        email: 'suspended@hospital.org',
        passwordHash: testPasswordHash,
        firstName: 'Suspended',
        lastName: 'User',
        role: Role.NURSE,
        status: UserStatus.SUSPENDED,
      })

      await expect(
        authService.login({
          email: 'suspended@hospital.org',
          password: 'Password@123',
        })
      ).rejects.toThrow(ForbiddenException)
    })

    it('should rotate tokens and return new session upon refresh', async () => {
      const loginRes = await authService.login({
        email: 'doctor@hospital.org',
        password: 'Password@123',
      })

      const oldRefreshToken = loginRes.tokens.refreshToken
      const refreshRes = await authService.refreshToken(oldRefreshToken)

      expect(refreshRes.tokens.accessToken).toBeDefined()
      expect(refreshRes.tokens.refreshToken).toBeDefined()
      expect(refreshRes.tokens.refreshToken).not.toBe(oldRefreshToken)

      // Old session should be revoked
      const oldSession = sessionRepo.sessions.find((s) => s.refreshToken === oldRefreshToken)
      expect(oldSession?.revokedAt).not.toBeNull()
    })

    it('should validate active session token and return SessionUser', async () => {
      const loginRes = await authService.login({
        email: 'doctor@hospital.org',
        password: 'Password@123',
      })

      const sessionUser = await authService.validateSession(loginRes.tokens.accessToken)
      expect(sessionUser.id).toBe('usr-doctor-001')
      expect(sessionUser.email).toBe('doctor@hospital.org')
      expect(sessionUser.role).toBe(Role.DOCTOR)
    })

    it('should reject invalid or forged access token', async () => {
      await expect(authService.validateSession('forged.invalid.token')).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should logout user and revoke refresh session', async () => {
      const loginRes = await authService.login({
        email: 'doctor@hospital.org',
        password: 'Password@123',
      })

      await authService.logout(loginRes.tokens.refreshToken, 'usr-doctor-001')

      const session = sessionRepo.sessions.find(
        (s) => s.refreshToken === loginRes.tokens.refreshToken
      )
      expect(session?.revokedAt).not.toBeNull()
      expect(auditRepo.logs.some((l) => l.action === 'USER_LOGOUT')).toBe(true)
    })

    it('should change password, update password hash, and revoke all active user sessions', async () => {
      await authService.login({ email: 'doctor@hospital.org', password: 'Password@123' })
      await authService.login({ email: 'doctor@hospital.org', password: 'Password@123' })
      expect(sessionRepo.sessions.filter((s) => !s.revokedAt).length).toBe(2)

      await authService.changePassword('usr-doctor-001', {
        currentPassword: 'Password@123',
        newPassword: 'NewSecurePassword@456',
      })

      // All sessions must be revoked
      expect(sessionRepo.sessions.every((s) => s.revokedAt !== null)).toBe(true)

      // Can login with new password
      const newLogin = await authService.login({
        email: 'doctor@hospital.org',
        password: 'NewSecurePassword@456',
      })
      expect(newLogin.user.id).toBe('usr-doctor-001')
    })
  })

  describe('Auth HTTP Endpoints, Middleware & Tenant Context Integration', () => {
    let app: Hono
    let testOrg1Id: string
    let testOrg2Id: string
    let testBranch1Id: string
    let testBranch2Id: string

    beforeEach(async () => {
      app = new Hono()
      app.onError(errorHandler)
      app.route('/api/v1/auth', authRoute)

      // Setup Organizations & Branches
      const org1 = await prisma.organization.upsert({
        where: { code: 'TEST-ORG-1' },
        update: { status: OrganizationStatus.ACTIVE },
        create: { name: 'Test Health System A', code: 'TEST-ORG-1', status: OrganizationStatus.ACTIVE },
      })
      testOrg1Id = org1.id

      const org2 = await prisma.organization.upsert({
        where: { code: 'TEST-ORG-2' },
        update: { status: OrganizationStatus.ACTIVE },
        create: { name: 'Test Health System B', code: 'TEST-ORG-2', status: OrganizationStatus.ACTIVE },
      })
      testOrg2Id = org2.id

      const branch1 = await prisma.branch.upsert({
        where: { organizationId_code: { organizationId: testOrg1Id, code: 'TEST-BR-1' } },
        update: { status: BranchStatus.ACTIVE },
        create: { organizationId: testOrg1Id, name: 'Test Branch 1', code: 'TEST-BR-1', status: BranchStatus.ACTIVE },
      })
      testBranch1Id = branch1.id

      const branch2 = await prisma.branch.upsert({
        where: { organizationId_code: { organizationId: testOrg2Id, code: 'TEST-BR-2' } },
        update: { status: BranchStatus.ACTIVE },
        create: { organizationId: testOrg2Id, name: 'Test Branch 2', code: 'TEST-BR-2', status: BranchStatus.ACTIVE },
      })
      testBranch2Id = branch2.id

      const passwordHash = await Bun.password.hash('Password@123', { algorithm: 'bcrypt', cost: 10 })

      // Create Staff User (Assigned to Org1, Branch1)
      await prisma.user.upsert({
        where: { email: 'staff.tenant@hospital.org' },
        update: { organizationId: testOrg1Id, branchId: testBranch1Id, status: UserStatus.ACTIVE },
        create: {
          email: 'staff.tenant@hospital.org',
          passwordHash,
          firstName: 'Tenant',
          lastName: 'Staff',
          role: Role.NURSE,
          organizationId: testOrg1Id,
          branchId: testBranch1Id,
          status: UserStatus.ACTIVE,
        },
      })

      // Create Super Admin User (No fixed Org/Branch)
      await prisma.user.upsert({
        where: { email: 'super.tenant@hospital.org' },
        update: { role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE },
        create: {
          email: 'super.tenant@hospital.org',
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      })

      // Protected Test Routes
      app.get('/api/v1/tenant-protected', requireAuth, requireTenantContext, (c) => {
        const org = c.get('organization')
        const branch = c.get('branch')
        return c.json({
          success: true,
          organization: org?.name,
          branch: branch?.name,
        })
      })

      app.get('/api/v1/org-only', requireAuth, requireOrganization, (c) => {
        const org = c.get('organization')
        return c.json({ success: true, organization: org?.name })
      })
    })

    it('POST /api/v1/auth/login should return 200 with JWT tokens and tenant associations', async () => {
      const res = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'staff.tenant@hospital.org',
            password: 'Password@123',
          }),
        })
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data.user.email).toBe('staff.tenant@hospital.org')
      expect(body.data.user.organizationId).toBe(testOrg1Id)
      expect(body.data.user.branchId).toBe(testBranch1Id)
    })

    it('requireAuth should automatically resolve default user Organization and Branch context', async () => {
      // 1. Login
      const loginRes = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'staff.tenant@hospital.org',
            password: 'Password@123',
          }),
        })
      )
      const loginBody = await loginRes.json()
      const token = loginBody.data.tokens.accessToken

      // 2. Request tenant-protected endpoint without explicit headers (uses user assigned defaults)
      const res = await app.fetch(
        new Request('http://localhost/api/v1/tenant-protected', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.organization).toBe('Test Health System A')
      expect(body.branch).toBe('Test Branch 1')
    })

    it('requireOrganization should accept explicit X-Organization-ID header', async () => {
      const loginRes = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'staff.tenant@hospital.org',
            password: 'Password@123',
          }),
        })
      )
      const loginBody = await loginRes.json()
      const token = loginBody.data.tokens.accessToken

      const res = await app.fetch(
        new Request('http://localhost/api/v1/org-only', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': testOrg1Id,
          },
        })
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.organization).toBe('Test Health System A')
    })

    it('requireOrganization should reject cross-tenant access for non-superadmin users with 403', async () => {
      const loginRes = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'staff.tenant@hospital.org',
            password: 'Password@123',
          }),
        })
      )
      const loginBody = await loginRes.json()
      const token = loginBody.data.tokens.accessToken

      // Staff user from Org1 attempts to access Org2
      const res = await app.fetch(
        new Request('http://localhost/api/v1/org-only', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': testOrg2Id,
          },
        })
      )

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS')
    })

    it('requireOrganization should allow SUPER_ADMIN to switch to any organization', async () => {
      const loginRes = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'super.tenant@hospital.org',
            password: 'Password@123',
          }),
        })
      )
      const loginBody = await loginRes.json()
      const token = loginBody.data.tokens.accessToken

      // SUPER_ADMIN accesses Org2
      const res = await app.fetch(
        new Request('http://localhost/api/v1/org-only', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': testOrg2Id,
          },
        })
      )

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.organization).toBe('Test Health System B')
    })

    it('requireBranch should reject branch-organization mismatch with 400', async () => {
      const loginRes = await app.fetch(
        new Request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'super.tenant@hospital.org',
            password: 'Password@123',
          }),
        })
      )
      const loginBody = await loginRes.json()
      const token = loginBody.data.tokens.accessToken

      // Pass Org1 but Branch2 (which belongs to Org2)
      const res = await app.fetch(
        new Request('http://localhost/api/v1/tenant-protected', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Organization-ID': testOrg1Id,
            'X-Branch-ID': testBranch2Id,
          },
        })
      )

      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.code).toBe('BRANCH_ORGANIZATION_MISMATCH')
    })
  })
})
