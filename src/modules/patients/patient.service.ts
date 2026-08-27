import { HTTPException } from 'hono/http-exception'
import { type Patient, type Prisma, Gender, BloodType } from '@prisma/client'
import {
  type IPatientRepository,
  patientRepository,
} from './patient.repository'
import {
  type IAuditLogRepository,
  auditLogRepository,
} from '@/modules/audit-logs'
import { eventBus, EventBus } from '@/shared/events/event-bus'
import type {
  CreatePatientDto,
  UpdatePatientDto,
  PatientQueryDto,
  PatientResponseDto,
} from './patient.dto'
import type { PaginationMeta } from '@/shared/types/pagination.type'

export class PatientService {
  constructor(
    private readonly patientRepo: IPatientRepository = patientRepository,
    private readonly auditRepo: IAuditLogRepository = auditLogRepository,
    private readonly events: EventBus = eventBus
  ) {}

  private generateMRN(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    return `MRN-${dateStr}-${randomSuffix}`
  }

  private sanitizePatient(patient: Patient): PatientResponseDto {
    const { deletedAt: _, ...sanitized } = patient
    return sanitized
  }

  async getPatientById(id: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepo.findById(id)
    if (!patient) {
      throw new HTTPException(404, { message: 'Patient not found' })
    }
    return this.sanitizePatient(patient)
  }

  async getPatientByMRN(mrn: string): Promise<PatientResponseDto> {
    const patient = await this.patientRepo.findByMRN(mrn)
    if (!patient) {
      throw new HTTPException(404, { message: 'Patient with this MRN not found' })
    }
    return this.sanitizePatient(patient)
  }

  async listPatients(query: PatientQueryDto): Promise<{
    patients: PatientResponseDto[]
    meta: PaginationMeta
  }> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const [patients, total] = await Promise.all([
      this.patientRepo.findAll({
        skip,
        take: limit,
        gender: query.gender,
        bloodType: query.bloodType,
        search: query.search,
      }),
      this.patientRepo.count({
        gender: query.gender,
        bloodType: query.bloodType,
        search: query.search,
      }),
    ])

    return {
      patients: patients.map((p) => this.sanitizePatient(p)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  }

  async registerPatient(
    data: CreatePatientDto,
    actorId?: string
  ): Promise<PatientResponseDto> {
    let mrn = data.medicalRecordNumber

    if (mrn) {
      const existingMRN = await this.patientRepo.findByMRN(mrn)
      if (existingMRN) {
        throw new HTTPException(409, {
          message: 'A patient with this Medical Record Number already exists',
        })
      }
    } else {
      mrn = this.generateMRN()
    }

    if (data.email) {
      const existingEmail = await this.patientRepo.findByEmail(data.email)
      if (existingEmail) {
        throw new HTTPException(409, {
          message: 'A patient with this email address already exists',
        })
      }
    }

    const createInput: Prisma.PatientCreateInput = {
      medicalRecordNumber: mrn,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender ?? Gender.UNKNOWN,
      bloodType: data.bloodType ?? BloodType.UNKNOWN,
      address: data.address || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
    }

    const patient = await this.patientRepo.create(createInput)

    // Audit Logging
    await this.auditRepo.create({
      userId: actorId ?? null,
      action: 'REGISTER_PATIENT',
      entity: 'Patient',
      entityId: patient.id,
      details: {
        medicalRecordNumber: patient.medicalRecordNumber,
        gender: patient.gender,
        bloodType: patient.bloodType,
      },
    })

    // Domain Event Publishing
    await this.events.publish('patient:registered', {
      patientId: patient.id,
      medicalRecordNumber: patient.medicalRecordNumber,
      actorId,
      timestamp: new Date(),
    })

    return this.sanitizePatient(patient)
  }

  async updatePatient(
    id: string,
    data: UpdatePatientDto,
    actorId?: string
  ): Promise<PatientResponseDto> {
    const existing = await this.patientRepo.findById(id)
    if (!existing) {
      throw new HTTPException(404, { message: 'Patient not found' })
    }

    if (data.email && data.email !== existing.email) {
      const emailInUse = await this.patientRepo.findByEmail(data.email)
      if (emailInUse) {
        throw new HTTPException(409, {
          message: 'A patient with this email address already exists',
        })
      }
    }

    const updateInput: Prisma.PatientUpdateInput = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
      ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      ...(data.gender && { gender: data.gender }),
      ...(data.bloodType && { bloodType: data.bloodType }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.emergencyContactName !== undefined && {
        emergencyContactName: data.emergencyContactName || null,
      }),
      ...(data.emergencyContactPhone !== undefined && {
        emergencyContactPhone: data.emergencyContactPhone || null,
      }),
    }

    const updated = await this.patientRepo.update(id, updateInput)

    // Audit Logging
    await this.auditRepo.create({
      userId: actorId ?? null,
      action: 'UPDATE_PATIENT',
      entity: 'Patient',
      entityId: updated.id,
      details: { updatedFields: Object.keys(data) },
    })

    // Domain Event Publishing
    await this.events.publish('patient:updated', {
      patientId: updated.id,
      updatedFields: Object.keys(data),
      actorId,
      timestamp: new Date(),
    })

    return this.sanitizePatient(updated)
  }

  async deletePatient(id: string, actorId?: string): Promise<void> {
    const existing = await this.patientRepo.findById(id)
    if (!existing) {
      throw new HTTPException(404, { message: 'Patient not found' })
    }

    await this.patientRepo.softDelete(id)

    // Audit Logging
    await this.auditRepo.create({
      userId: actorId ?? null,
      action: 'DELETE_PATIENT',
      entity: 'Patient',
      entityId: id,
    })

    // Domain Event Publishing
    await this.events.publish('patient:deleted', {
      patientId: id,
      actorId,
      timestamp: new Date(),
    })
  }
}

export const patientService = new PatientService()
