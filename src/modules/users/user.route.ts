import { Hono } from 'hono'
import { userController } from './user.controller'
import { validateBody, validateQuery } from '@/middlewares/validate.middleware'
import { createUserSchema, updateUserSchema, userQuerySchema } from './user.dto'

export const userRoute = new Hono()

userRoute.get('/', validateQuery(userQuerySchema), (c) => userController.listUsers(c))
userRoute.get('/:id', (c) => userController.getUser(c))
userRoute.post('/', validateBody(createUserSchema), (c) => userController.createUser(c))
userRoute.patch('/:id', validateBody(updateUserSchema), (c) => userController.updateUser(c))
userRoute.delete('/:id', (c) => userController.deleteUser(c))
