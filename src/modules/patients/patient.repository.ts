import { type Patient, type Prisma, Gender, BloodType } from '@prisma/client'
import { prisma } from '@/db/prisma'
import { parseSorting, parseSearch, parseDateRange } from '@/shared/utils/query.util'
import { PATIENT_SORTABLE_FIELDS, type PatientSortableField } from './patient.dto'
import type { SortOrder } from '@/shared/types/pagination.type'

export interface FindAllPatientsParams {
  skip?: number
  take?: number
  gender?: Gender
  bloodType?: BloodType
  search?: string
  sortBy?: PatientSortableField
  sortOrder?: SortOrder
  startDate?: string
  endDate?: string
}

export interface IPatientRepository {
  findById(id: string): Promise<Patient | null>
  findByMRN(mrn: string): Promise<Patient | null>
  findByEmail(email: string): Promise<Patient | null>
  findAll(params: FindAllPatientsParams): Promise<Patient[]>
  count(params: FindAllPatientsParams): Promise<number>
  create(data: Prisma.PatientCreateInput): Promise<Patient>
  update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient>
  softDelete(id: string): Promise<Patient>
}

export class PatientRepository implements IPatientRepository {
  private buildWhereClause(params: FindAllPatientsParams): Prisma.PatientWhereInput {
    const searchCondition = parseSearch(params.search, [
      'firstName',
      'lastName',
      'medicalRecordNumber',
      'email',
      'phoneNumber',
    ])
    const dateCondition = parseDateRange(params.startDate, params.endDate, 'createdAt')

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(params.gender && { gender: params.gender }),
      ...(params.bloodType && { bloodType: params.bloodType }),
      ...searchCondition,
      ...dateCondition,
    }

    return where
  }

  async findById(id: string): Promise<Patient | null> {
    return prisma.patient.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByMRN(mrn: string): Promise<Patient | null> {
    return prisma.patient.findFirst({
      where: { medicalRecordNumber: mrn, deletedAt: null },
    })
  }

  async findByEmail(email: string): Promise<Patient | null> {
    return prisma.patient.findFirst({
      where: { email, deletedAt: null },
    })
  }

  async findAll(params: FindAllPatientsParams): Promise<Patient[]> {
    const where = this.buildWhereClause(params)
    const orderBy = parseSorting<PatientSortableField>(
      { sortBy: params.sortBy, sortOrder: params.sortOrder },
      PATIENT_SORTABLE_FIELDS,
      'createdAt',
      'desc'
    )

    return prisma.patient.findMany({
      where,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy,
    })
  }

  async count(params: FindAllPatientsParams): Promise<number> {
    const where = this.buildWhereClause(params)
    return prisma.patient.count({ where })
  }

  async create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return prisma.patient.create({ data })
  }

  async update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
    return prisma.patient.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string): Promise<Patient> {
    return prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

export const patientRepository = new PatientRepository()
