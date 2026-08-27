import { z } from 'zod'
import { Role, UserStatus } from '@prisma/client'
import { baseQuerySchema } from '@/shared/types/pagination.type'

export const roleEnumSchema = z.nativeEnum(Role)
export const userStatusEnumSchema = z.nativeEnum(UserStatus)

export const USER_SORTABLE_FIELDS = [
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'email',
  'role',
  'status',
] as const
export type UserSortableField = (typeof USER_SORTABLE_FIELDS)[number]

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: roleEnumSchema.default(Role.RECEPTIONIST),
  status: userStatusEnumSchema.default(UserStatus.ACTIVE),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
})

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z.string().min(8, 'Password must be at least 8 characters long').optional(),
  })

export const userQuerySchema = baseQuerySchema.extend({
  role: roleEnumSchema.optional(),
  status: userStatusEnumSchema.optional(),
})

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type UserQueryDto = z.infer<typeof userQuerySchema>

export interface UserResponseDto {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  status: UserStatus
  phoneNumber: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}
