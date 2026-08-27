import { type Patient, type Prisma, Gender, BloodType } from '@prisma/client'
import { prisma } from '@/db/prisma'

export interface FindAllPatientsParams {
  skip?: number
  take?: number
  gender?: Gender
  bloodType?: BloodType
  search?: string
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
    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
    }

    if (params.gender) {
      where.gender = params.gender
    }

    if (params.bloodType) {
      where.bloodType = params.bloodType
    }

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { medicalRecordNumber: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ]
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
    return prisma.patient.findMany({
      where,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy: { createdAt: 'desc' },
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
