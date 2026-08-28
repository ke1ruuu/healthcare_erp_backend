import { Hono } from 'hono'
import { validateBody } from '@/middlewares/validate.middleware'
import { requireAuth, optionalAuth } from '@/middlewares/auth.middleware'
import { authController } from './auth.controller'
import {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.dto'

export const authRoute = new Hono()

// Public Auth Endpoints
authRoute.post('/login', validateBody(loginSchema), authController.login)
authRoute.post('/refresh', validateBody(refreshTokenSchema), authController.refresh)
authRoute.post('/logout', optionalAuth, authController.logout)

// Protected Session Endpoints
authRoute.get('/me', requireAuth, authController.getMe)
authRoute.post(
  '/change-password',
  requireAuth,
  validateBody(changePasswordSchema),
  authController.changePassword
)
