import type { Context } from 'hono'
import {
  type IAuthService,
  authService,
} from './auth.service'
import type {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  SessionUser,
} from './auth.dto'
import { sendSuccess } from '@/shared/utils/response.util'

export class AuthController {
  constructor(private readonly authSvc: IAuthService = authService) {}

  login = async (c: Context) => {
    const data = c.get('validatedBody') as LoginDto
    const userAgent = c.req.header('user-agent')
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1'

    const result = await this.authSvc.login(data, { userAgent, ipAddress })
    return sendSuccess(c, result, 'User logged in successfully')
  }

  refresh = async (c: Context) => {
    const data = c.get('validatedBody') as RefreshTokenDto
    const userAgent = c.req.header('user-agent')
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1'

    const result = await this.authSvc.refreshToken(data.refreshToken, { userAgent, ipAddress })
    return sendSuccess(c, result, 'Session refreshed successfully')
  }

  logout = async (c: Context) => {
    let refreshToken: string | undefined
    try {
      const body = await c.req.json()
      refreshToken = body?.refreshToken
    } catch {
      // Body is optional on logout
    }

    const userId = c.get('userId')
    await this.authSvc.logout(refreshToken, userId)
    return sendSuccess(c, { loggedOut: true }, 'Logged out successfully')
  }

  getMe = async (c: Context) => {
    const user = c.get('user') as SessionUser
    const profile = await this.authSvc.getCurrentUser(user.id)
    return sendSuccess(c, profile, 'Authenticated profile retrieved successfully')
  }

  changePassword = async (c: Context) => {
    const user = c.get('user') as SessionUser
    const data = c.get('validatedBody') as ChangePasswordDto

    await this.authSvc.changePassword(user.id, data)
    return sendSuccess(
      c,
      { updated: true },
      'Password changed successfully. All active sessions have been revoked.'
    )
  }
}

export const authController = new AuthController()
