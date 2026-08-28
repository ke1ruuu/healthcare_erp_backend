import { describe, expect, it } from 'bun:test'
import { PatientService } from './patient.service'
import type { IPatientRepository, FindAllPatientsParams } from './patient.repository'
import type { IAuditLogRepository } from '@/modules/audit-logs'
import { EventBus } from '@/shared/events/event-bus'
import { Gender, BloodType, PatientStatus, type Patient, type Prisma } from '@prisma/client'
import { NotFoundException, ConflictException } from '@/shared/exceptions/app.exception'
import { PatientController } from './patient.controller'
import { Hono } from 'hono'
import { errorHandler } from '@/middlewares/error.middleware'

// In-memory Mock Repository
class MockPatientRepository implements IPatientRepository {
  private patients: Patient[] = []

  async findById(id: string): Promise<Patient | null> {
    return this.patients.find((p) => p.id === id && p.deletedAt === null) ?? null
  }

  async findByMRN(mrn: string): Promise<Patient | null> {
    return this.patients.find((p) => p.medicalRecordNumber === mrn && p.deletedAt === null) ?? null
  }

  async findByEmail(email: string): Promise<Patient | null> {
    return this.patients.find((p) => p.email === email && p.deletedAt === null) ?? null
  }

  async findAll(params: FindAllPatientsParams): Promise<Patient[]> {
    let result = this.patients.filter((p) => p.deletedAt === null)
    if (params.gender) {
      result = result.filter((p) => p.gender === params.gender)
    }
    if (params.bloodType) {
      result = result.filter((p) => p.bloodType === params.bloodType)
    }
    if (params.status) {
      result = result.filter((p) => p.status === params.status)
    }
    const skip = params.skip ?? 0
    const take = params.take ?? 20
    return result.slice(skip, skip + take)
  }

  async count(params: FindAllPatientsParams): Promise<number> {
    const all = await this.findAll(params)
    return all.length
  }

  async create(data: Prisma.PatientCreateInput): Promise<Patient> {
    const patient: Patient = {
      id: `mock-patient-${this.patients.length + 1}`,
      medicalRecordNumber: data.medicalRecordNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phoneNumber: data.phoneNumber ?? null,
      dateOfBirth: new Date(data.dateOfBirth as string | Date),
      gender: (data.gender as Gender) ?? Gender.UNKNOWN,
      bloodType: (data.bloodType as BloodType) ?? BloodType.UNKNOWN,
      status: (data.status as PatientStatus) ?? PatientStatus.ACTIVE,
      address: data.address ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }
    this.patients.push(patient)
    return patient
  }

  async update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
    const idx = this.patients.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Not found')
    this.patients[idx] = {
      ...this.patients[idx],
      ...(data.firstName && { firstName: data.firstName as string }),
      ...(data.lastName && { lastName: data.lastName as string }),
      ...(data.email !== undefined && { email: data.email as string | null }),
      updatedAt: new Date(),
    }
    return this.patients[idx]
  }

  async softDelete(id: string): Promise<Patient> {
    const idx = this.patients.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Not found')
    this.patients[idx].deletedAt = new Date()
    return this.patients[idx]
  }
}

class MockAuditLogRepository implements IAuditLogRepository {
  async create(): Promise<void> {
    // In-memory no-op
  }
}

describe('Patients Domain Module - Application Service (Unit Tests)', () => {
  it('should register a patient, auto-generate MRN, and emit domain event', async () => {
    const mockRepo = new MockPatientRepository()
    const mockAudit = new MockAuditLogRepository()
    const eventBus = new EventBus()
    const service = new PatientService(mockRepo, mockAudit, eventBus)

    let eventFired = false
    let emittedMRN = ''
    eventBus.subscribe('patient:registered', (payload) => {
      eventFired = true
      emittedMRN = payload.medicalRecordNumber
    })

    const result = await service.registerPatient({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      dateOfBirth: new Date('1990-05-15'),
      gender: Gender.FEMALE,
      bloodType: BloodType.O_POSITIVE,
    })

    expect(result.id).toBeDefined()
    expect(result.medicalRecordNumber).toMatch(/^MRN-\d{8}-\d{4}$/)
    expect(result.firstName).toBe('Jane')
    expect(result.lastName).toBe('Doe')
    expect(result.gender).toBe(Gender.FEMALE)
    expect(result.bloodType).toBe(BloodType.O_POSITIVE)
    expect(eventFired).toBe(true)
    expect(emittedMRN).toBe(result.medicalRecordNumber)
  })

  it('should throw 409 Conflict when registering patient with duplicate MRN', async () => {
    const mockRepo = new MockPatientRepository()
    const mockAudit = new MockAuditLogRepository()
    const eventBus = new EventBus()
    const service = new PatientService(mockRepo, mockAudit, eventBus)

    await service.registerPatient({
      firstName: 'John',
      lastName: 'Doe',
      medicalRecordNumber: 'MRN-FIXED-0001',
      dateOfBirth: new Date('1985-01-01'),
    })

    await expect(
      service.registerPatient({
        firstName: 'Another',
        lastName: 'Patient',
        medicalRecordNumber: 'MRN-FIXED-0001',
        dateOfBirth: new Date('1988-02-02'),
      })
    ).rejects.toThrow(ConflictException)
  })

  it('should throw 404 Not Found when looking up non-existent patient', async () => {
    const mockRepo = new MockPatientRepository()
    const mockAudit = new MockAuditLogRepository()
    const service = new PatientService(mockRepo, mockAudit)

    await expect(service.getPatientById('non-existent-id')).rejects.toThrow(NotFoundException)
  })
})

describe('Patients Domain Module - Controller & API Routes (Integration Tests)', () => {
  it('should handle full HTTP lifecycle (POST, GET, PATCH, DELETE) with standard response envelope', async () => {
    const mockRepo = new MockPatientRepository()
    const mockAudit = new MockAuditLogRepository()
    const eventBus = new EventBus()
    const service = new PatientService(mockRepo, mockAudit, eventBus)
    const controller = new PatientController(service)

    const app = new Hono()
    app.onError(errorHandler)
    app.post('/patients', (c) => controller.registerPatient(c))
    app.get('/patients', (c) => controller.listPatients(c))
    app.get('/patients/:id', (c) => controller.getPatient(c))
    app.get('/patients/mrn/:mrn', (c) => controller.getPatientByMRN(c))
    app.patch('/patients/:id', (c) => controller.updatePatient(c))
    app.delete('/patients/:id', (c) => controller.deletePatient(c))

    // 1. Register patient via POST /patients
    const createRes = await app.fetch(
      new Request('http://localhost/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Robert',
          lastName: 'Langdon',
          email: 'robert.langdon@harvard.edu',
          dateOfBirth: '1964-06-22',
          gender: 'MALE',
          bloodType: 'A_POSITIVE',
        }),
      })
    )

    expect(createRes.status).toBe(201)
    const createBody = await createRes.json()
    expect(createBody.success).toBe(true)
    expect(createBody.data.firstName).toBe('Robert')
    const patientId = createBody.data.id
    const mrn = createBody.data.medicalRecordNumber

    // 2. Get patient by ID via GET /patients/:id
    const getRes = await app.fetch(new Request(`http://localhost/patients/${patientId}`))
    expect(getRes.status).toBe(200)
    const getBody = await getRes.json()
    expect(getBody.success).toBe(true)
    expect(getBody.data.id).toBe(patientId)

    // 3. Get patient by MRN via GET /patients/mrn/:mrn
    const getMRNRes = await app.fetch(new Request(`http://localhost/patients/mrn/${mrn}`))
    expect(getMRNRes.status).toBe(200)
    const getMRNBody = await getMRNRes.json()
    expect(getMRNBody.data.medicalRecordNumber).toBe(mrn)

    // 4. Update patient via PATCH /patients/:id
    const updateRes = await app.fetch(
      new Request(`http://localhost/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastName: 'Langdon-Brown',
        }),
      })
    )
    expect(updateRes.status).toBe(200)
    const updateBody = await updateRes.json()
    expect(updateBody.data.lastName).toBe('Langdon-Brown')

    // 5. Delete patient via DELETE /patients/:id
    const deleteRes = await app.fetch(
      new Request(`http://localhost/patients/${patientId}`, {
        method: 'DELETE',
      })
    )
    expect(deleteRes.status).toBe(200)
    const deleteBody = await deleteRes.json()
    expect(deleteBody.success).toBe(true)

    // 6. Verify 404 after soft-deletion
    const getDeletedRes = await app.fetch(new Request(`http://localhost/patients/${patientId}`))
    expect(getDeletedRes.status).toBe(404)
  })
})
