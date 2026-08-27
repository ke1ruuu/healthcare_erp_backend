import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { userService, type UserService } from './user.service'
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from './user.dto'

export class UserController {
  constructor(private readonly service: UserService = userService) {}

  async getUser(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    const user = await this.service.getUserById(id)

    return c.json({
      success: true,
      data: user,
    })
  }

  async listUsers(c: Context) {
    const rawQuery = c.req.query()
    const query = userQuerySchema.parse(rawQuery)
    const result = await this.service.listUsers(query)

    return c.json({
      success: true,
      data: result.users,
      meta: result.meta,
    })
  }

  async createUser(c: Context) {
    const body = await c.req.json()
    const validated = createUserSchema.parse(body)
    const userContext = c.get('user') as { id?: string } | undefined

    const user = await this.service.createUser(validated, userContext?.id)
    return c.json(
      {
        success: true,
        data: user,
        message: 'User created successfully',
      },
      201
    )
  }

  async updateUser(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    const body = await c.req.json()
    const validated = updateUserSchema.parse(body)
    const userContext = c.get('user') as { id?: string } | undefined

    const user = await this.service.updateUser(id, validated, userContext?.id)
    return c.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    })
  }

  async deleteUser(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new HTTPException(400, { message: 'User ID is required' })
    }

    const userContext = c.get('user') as { id?: string } | undefined

    await this.service.deleteUser(id, userContext?.id)
    return c.json({
      success: true,
      message: 'User deleted successfully',
    })
  }
}

export const userController = new UserController()
