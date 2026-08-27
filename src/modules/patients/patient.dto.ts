import { z } from 'zod'
import { Gender, BloodType } from '@prisma/client'
import { baseQuerySchema } from '@/shared/types/pagination.type'

export const genderEnumSchema = z.nativeEnum(Gender)
export const bloodTypeEnumSchema = z.nativeEnum(BloodType)

export const PATIENT_SORTABLE_FIELDS = [
  'createdAt',
  'updatedAt',
  'firstName',
  'lastName',
  'dateOfBirth',
  'medicalRecordNumber',
  'gender',
  'bloodType',
] as const
export type PatientSortableField = (typeof PATIENT_SORTABLE_FIELDS)[number]

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phoneNumber: z.string().min(5, 'Phone number must be at least 5 digits').optional().or(z.literal('')),
  dateOfBirth: z.coerce.date({ message: 'Valid date of birth is required' }),
  gender: genderEnumSchema.optional().default(Gender.UNKNOWN),
  bloodType: bloodTypeEnumSchema.optional().default(BloodType.UNKNOWN),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalRecordNumber: z.string().optional(),
})

export const updatePatientSchema = createPatientSchema.partial()

export const patientQuerySchema = baseQuerySchema.extend({
  gender: genderEnumSchema.optional(),
  bloodType: bloodTypeEnumSchema.optional(),
})

export type CreatePatientDto = z.input<typeof createPatientSchema>
export type UpdatePatientDto = z.input<typeof updatePatientSchema>
export type PatientQueryDto = z.infer<typeof patientQuerySchema>

export interface PatientResponseDto {
  id: string
  medicalRecordNumber: string
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  dateOfBirth: Date
  gender: Gender
  bloodType: BloodType
  address: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  createdAt: Date
  updatedAt: Date
}
