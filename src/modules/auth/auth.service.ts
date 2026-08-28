import { sign, verify } from 'hono/jwt'
import { env } from '@/config/env'
import {
  type IUserRepository,
  userRepository,
} from '@/modules/users'
import {
  type IAuditLogRepository,
  auditLogRepository,
} from '@/modules/audit-logs'
import {
  type ISessionRepository,
  sessionRepository,
} from './session.repository'
import type {
  LoginDto,
  ChangePasswordDto,
  AuthResponseDto,
  SessionUser,
  SessionMetadata,
  JwtTokenPayload,
} from './auth.dto'
import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@/shared/exceptions/app.exception'
import { UserStatus } from '@prisma/client'

const ACCESS_TOKEN_EXPIRES_SECONDS = 15 * 60 // 15 minutes
const REFRESH_TOKEN_EXPIRES_DAYS = 7 // 7 days

export interface IAuthService {
  login(data: LoginDto, metadata?: SessionMetadata): Promise<AuthResponseDto>
  refreshToken(token: string, metadata?: SessionMetadata): Promise<AuthResponseDto>
  logout(refreshToken?: string, actorId?: string): Promise<void>
  validateSession(accessToken: string): Promise<SessionUser>
  getCurrentUser(userId: string): Promise<SessionUser>
  changePassword(userId: string, data: ChangePasswordDto): Promise<void>
}

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepo: IUserRepository = userRepository,
    private readonly sessionRepo: ISessionRepository = sessionRepository,
    private readonly auditRepo: IAuditLogRepository = auditLogRepository
  ) {}

  private async generateAccessToken(user: SessionUser): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const payload: JwtTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      orgId: user.organizationId ?? null,
      branchId: user.branchId ?? null,
      iat: now,
      exp: now + ACCESS_TOKEN_EXPIRES_SECONDS,
    }
    return sign(payload, env.JWT_SECRET, 'HS256')
  }

  private generateRefreshTokenString(): string {
    return `rt_${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`
  }

  private mapToSessionUser(user: any): SessionUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId ?? null,
      branchId: user.branchId ?? null,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            code: user.organization.code,
            status: user.organization.status,
          }
        : null,
      branch: user.branch
        ? {
            id: user.branch.id,
            organizationId: user.branch.organizationId,
            name: user.branch.name,
            code: user.branch.code,
            status: user.branch.status,
          }
        : null,
    }
  }

  async login(data: LoginDto, metadata?: SessionMetadata): Promise<AuthResponseDto> {
    const user = await this.userRepo.findByEmail(data.email)
    if (!user) {
      throw new UnauthorizedException('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    const isPasswordValid = await Bun.password.verify(data.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your staff account has been suspended', 'ACCOUNT_SUSPENDED')
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Your staff account is currently inactive', 'ACCOUNT_INACTIVE')
    }

    const sessionUser = this.mapToSessionUser(user)
    const accessToken = await this.generateAccessToken(sessionUser)
    const refreshToken = this.generateRefreshTokenString()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000)

    await this.sessionRepo.createSession({
      userId: user.id,
      refreshToken,
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
      expiresAt,
    })

    // Log forensic audit entry
    await this.auditRepo.create({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        branchId: user.branchId,
      },
      ipAddress: metadata?.ipAddress || null,
      userAgent: metadata?.userAgent || null,
    })

    return {
      user: sessionUser,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_EXPIRES_SECONDS,
      },
    }
  }

  async refreshToken(token: string, metadata?: SessionMetadata): Promise<AuthResponseDto> {
    const session = await this.sessionRepo.findByRefreshToken(token)
    if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token', 'INVALID_SESSION')
    }

    const user = await this.userRepo.findById(session.userId)
    if (!user || user.deletedAt !== null || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is invalid or inactive', 'INVALID_USER_STATUS')
    }

    // Refresh Token Rotation: Revoke old session
    await this.sessionRepo.revokeSession(token)

    const sessionUser = this.mapToSessionUser(user)
    const newAccessToken = await this.generateAccessToken(sessionUser)
    const newRefreshToken = this.generateRefreshTokenString()
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000)

    await this.sessionRepo.createSession({
      userId: user.id,
      refreshToken: newRefreshToken,
      userAgent: metadata?.userAgent || null,
      ipAddress: metadata?.ipAddress || null,
      expiresAt,
    })

    return {
      user: sessionUser,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_EXPIRES_SECONDS,
      },
    }
  }

  async logout(refreshToken?: string, actorId?: string): Promise<void> {
    if (refreshToken) {
      await this.sessionRepo.revokeSession(refreshToken)
    }

    if (actorId) {
      await this.auditRepo.create({
        userId: actorId,
        action: 'USER_LOGOUT',
        entity: 'User',
        entityId: actorId,
        details: { timestamp: new Date().toISOString() },
      })
    }
  }

  async validateSession(accessToken: string): Promise<SessionUser> {
    let payload: any
    try {
      payload = await verify(accessToken, env.JWT_SECRET, 'HS256')
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token', 'INVALID_TOKEN')
    }

    if (!payload?.sub) {
      throw new UnauthorizedException('Malformed authentication token', 'INVALID_TOKEN')
    }

    const user = await this.userRepo.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists', 'USER_NOT_FOUND')
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Your staff account is not active', 'ACCOUNT_NOT_ACTIVE')
    }

    return this.mapToSessionUser(user)
  }

  async getCurrentUser(userId: string): Promise<SessionUser> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new NotFoundException('User profile not found', 'USER_NOT_FOUND')
    }

    return this.mapToSessionUser(user)
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found', 'USER_NOT_FOUND')
    }

    const isMatch = await Bun.password.verify(data.currentPassword, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match', 'INVALID_CURRENT_PASSWORD')
    }

    const newPasswordHash = await Bun.password.hash(data.newPassword, {
      algorithm: 'bcrypt',
      cost: 10,
    })

    await this.userRepo.update(userId, { passwordHash: newPasswordHash })

    // Invalidate all active sessions for this user on password change
    await this.sessionRepo.revokeAllUserSessions(userId)

    // Audit Log
    await this.auditRepo.create({
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
      details: { timestamp: new Date().toISOString() },
    })
  }
}

export const authService = new AuthService()
