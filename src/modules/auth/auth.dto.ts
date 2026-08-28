import { z } from 'zod'
import { Role, UserStatus, OrganizationStatus, BranchStatus } from '@prisma/client'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
})

export type LoginDto = z.infer<typeof loginSchema>
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>

export interface OrganizationContext {
  id: string
  name: string
  code: string
  status: OrganizationStatus
}

export interface BranchContext {
  id: string
  organizationId: string
  name: string
  code: string
  status: BranchStatus
}

export interface SessionUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  status: UserStatus
  organizationId?: string | null
  branchId?: string | null
  organization?: OrganizationContext | null
  branch?: BranchContext | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number // seconds
}

export interface AuthResponseDto {
  user: SessionUser
  tokens: AuthTokens
}

export interface SessionMetadata {
  userAgent?: string
  ipAddress?: string
}

export interface JwtTokenPayload {
  [key: string]: unknown
  sub: string
  email: string
  role: Role
  status: UserStatus
  orgId?: string | null
  branchId?: string | null
  exp: number
  iat: number
}
