import { Hono } from 'hono'
import { userController } from './user.controller'

export const userRoute = new Hono()

userRoute.get('/', (c) => userController.listUsers(c))
userRoute.get('/:id', (c) => userController.getUser(c))
userRoute.post('/', (c) => userController.createUser(c))
userRoute.patch('/:id', (c) => userController.updateUser(c))
userRoute.delete('/:id', (c) => userController.deleteUser(c))
