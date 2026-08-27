import type { Context } from 'hono'
import { userService, type UserService } from './user.service'
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  type CreateUserDto,
  type UpdateUserDto,
  type UserQueryDto,
} from './user.dto'
import {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendNoContent,
} from '@/shared/utils/response.util'
import { NotFoundException } from '@/shared/exceptions/app.exception'

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  async getUser(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new NotFoundException('User ID is required')
    }
    const user = await this.service.getUserById(id)
    return sendSuccess(c, user)
  }

  async listUsers(c: Context) {
    const validated = c.get('validatedQuery') as UserQueryDto | undefined
    const query = validated ?? userQuerySchema.parse(c.req.query())
    const result = await this.service.listUsers(query)
    return sendPaginated(c, result.users, result.meta)
  }

  async createUser(c: Context) {
    const validated = c.get('validatedBody') as CreateUserDto | undefined
    const body = validated ?? createUserSchema.parse(await c.req.json())
    const userContext = c.get('user') as { id?: string } | undefined

    const user = await this.service.createUser(body, userContext?.id)
    return sendCreated(c, user, 'User created successfully')
  }

  async updateUser(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new NotFoundException('User ID is required')
    }
    const validated = c.get('validatedBody') as UpdateUserDto | undefined
    const body = validated ?? updateUserSchema.parse(await c.req.json())
    const userContext = c.get('user') as { id?: string } | undefined

    const user = await this.service.updateUser(id, body, userContext?.id)
    return sendSuccess(c, user, 'User updated successfully')
  }

  async deleteUser(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new NotFoundException('User ID is required')
    }
    const userContext = c.get('user') as { id?: string } | undefined

    await this.service.deleteUser(id, userContext?.id)
    return sendNoContent(c, 'User deleted successfully')
  }
}

export const userController = new UserController()
