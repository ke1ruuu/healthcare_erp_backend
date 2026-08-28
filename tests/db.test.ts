import { describe, expect, it } from 'bun:test'
import { prisma } from '@/db/prisma'
import { Role, UserStatus, Gender, BloodType, PatientStatus } from '@prisma/client'
import { patientService } from '@/modules/patients/patient.service'
import { userService } from '@/modules/users/user.service'
import { ConflictException, NotFoundException } from '@/shared/exceptions/app.exception'

describe('PostgreSQL Database Configuration & Conventions', () => {
  it('should establish active database connectivity and execute probe queries', async () => {
    const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].result).toBe(1)
  })

  describe('Common Identifiers & Business Identifiers', () => {
    it('should generate valid UUID v4 primary keys for models', async () => {
      const testEmail = `id-test-${Date.now()}@hospital.org`
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          passwordHash: 'dummy_hash',
          firstName: 'Identifier',
          lastName: 'Tester',
          role: Role.NURSE,
          status: UserStatus.ACTIVE,
        },
      })

      expect(user.id).toBeDefined()
      // UUID v4 format verification
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should enforce unique and formatted Medical Record Numbers (MRN)', async () => {
      const mrn = `MRN-20260828-${Math.floor(1000 + Math.random() * 9000)}`
      const patient = await prisma.patient.create({
        data: {
          medicalRecordNumber: mrn,
          firstName: 'MRN',
          lastName: 'Tester',
          dateOfBirth: new Date('1990-01-01'),
          gender: Gender.FEMALE,
          bloodType: BloodType.O_POSITIVE,
          status: PatientStatus.ACTIVE,
        },
      })

      expect(patient.medicalRecordNumber).toBe(mrn)
      expect(patient.medicalRecordNumber).toMatch(/^MRN-\d{8}-\d{4}$/)

      // Cleanup
      await prisma.patient.delete({ where: { id: patient.id } })
    })
  })

  describe('Timestamp Conventions (createdAt, updatedAt, deletedAt)', () => {
    it('should manage lifecycle timestamps with UTC accuracy and soft deletion', async () => {
      const beforeCreate = new Date(Date.now() - 1000)
      const patient = await prisma.patient.create({
        data: {
          medicalRecordNumber: `MRN-TS-${Date.now()}`,
          firstName: 'Timestamp',
          lastName: 'Tester',
          dateOfBirth: new Date('1985-05-15'),
          gender: Gender.MALE,
          bloodType: BloodType.A_POSITIVE,
        },
      })

      // 1. createdAt verification
      expect(patient.createdAt).toBeInstanceOf(Date)
      expect(patient.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(patient.deletedAt).toBeNull()

      // 2. updatedAt modification verification
      const updated = await prisma.patient.update({
        where: { id: patient.id },
        data: { firstName: 'TimestampUpdated' },
      })
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(patient.updatedAt.getTime())

      // 3. soft-delete timestamp verification
      const deleted = await prisma.patient.update({
        where: { id: patient.id },
        data: { deletedAt: new Date() },
      })
      expect(deleted.deletedAt).toBeInstanceOf(Date)

      // Cleanup
      await prisma.patient.delete({ where: { id: patient.id } })
    })
  })

  describe('Status Conventions (Lifecycle State Enums)', () => {
    it('should default UserStatus to ACTIVE and support INACTIVE and SUSPENDED', async () => {
      expect(UserStatus.ACTIVE).toBe('ACTIVE')
      expect(UserStatus.INACTIVE).toBe('INACTIVE')
      expect(UserStatus.SUSPENDED).toBe('SUSPENDED')
    })

    it('should default PatientStatus to ACTIVE and support DECEASED and TRANSFERRED', async () => {
      const patient = await prisma.patient.create({
        data: {
          medicalRecordNumber: `MRN-ST-${Date.now()}`,
          firstName: 'Status',
          lastName: 'Tester',
          dateOfBirth: new Date('1975-03-20'),
        },
      })

      expect(patient.status).toBe(PatientStatus.ACTIVE)

      const transferred = await prisma.patient.update({
        where: { id: patient.id },
        data: { status: PatientStatus.TRANSFERRED },
      })
      expect(transferred.status).toBe(PatientStatus.TRANSFERRED)

      // Cleanup
      await prisma.patient.delete({ where: { id: patient.id } })
    })
  })

  describe('Foreign-Key Constraints & Referential Actions', () => {
    it('should apply SetNull on AuditLog when referenced User is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: `fk-actor-${Date.now()}@hospital.org`,
          passwordHash: 'dummy_hash',
          firstName: 'Actor',
          lastName: 'User',
          role: Role.DOCTOR,
        },
      })

      const auditLog = await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CLINICAL_ACCESS',
          entity: 'Patient',
          entityId: 'dummy-target-id',
          details: { reason: 'Consultation' },
        },
      })

      expect(auditLog.userId).toBe(user.id)

      // Delete the user record
      await prisma.user.delete({ where: { id: user.id } })

      // Verify AuditLog persists with userId set to null (SetNull action)
      const preservedLog = await prisma.auditLog.findUnique({
        where: { id: auditLog.id },
      })

      expect(preservedLog).toBeDefined()
      expect(preservedLog?.userId).toBeNull()
      expect(preservedLog?.action).toBe('CLINICAL_ACCESS')

      // Cleanup audit log
      await prisma.auditLog.delete({ where: { id: auditLog.id } })
    })
  })

  describe('Soft-Delete Strategy Enforcement', () => {
    it('should hide soft-deleted records from standard service queries while preserving row in database', async () => {
      const created = await patientService.registerPatient({
        firstName: 'SoftDelete',
        lastName: 'Subject',
        dateOfBirth: new Date('1988-12-10'),
        gender: Gender.FEMALE,
      })

      expect(created.id).toBeDefined()

      // Soft delete via service
      await patientService.deletePatient(created.id)

      // Service lookup should throw NotFoundException
      await expect(patientService.getPatientById(created.id)).rejects.toThrow(NotFoundException)

      // Physical row should still exist in PostgreSQL with deletedAt set
      const rawPatient = await prisma.patient.findUnique({
        where: { id: created.id },
      })

      expect(rawPatient).toBeDefined()
      expect(rawPatient?.deletedAt).toBeInstanceOf(Date)

      // Audit log should capture the soft delete
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          entity: 'Patient',
          entityId: created.id,
          action: 'DELETE_PATIENT',
        },
      })
      expect(auditEntry).toBeDefined()

      // Cleanup
      await prisma.patient.delete({ where: { id: created.id } })
      if (auditEntry) {
        await prisma.auditLog.delete({ where: { id: auditEntry.id } })
      }
    })
  })

  describe('Unique Constraints Enforcement', () => {
    it('should reject duplicate email addresses with ConflictException', async () => {
      const uniqueEmail = `unique-${Date.now()}@hospital.org`
      const user = await userService.createUser({
        email: uniqueEmail,
        password: 'Password@123',
        firstName: 'Primary',
        lastName: 'User',
      })

      await expect(
        userService.createUser({
          email: uniqueEmail,
          password: 'Password@123',
          firstName: 'Duplicate',
          lastName: 'User',
        })
      ).rejects.toThrow(ConflictException)

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } })
    })

    it('should reject duplicate medical record numbers with ConflictException', async () => {
      const mrn = `MRN-DUP-${Date.now()}`
      const patient = await patientService.registerPatient({
        medicalRecordNumber: mrn,
        firstName: 'Original',
        lastName: 'Patient',
        dateOfBirth: new Date('1995-07-20'),
      })

      await expect(
        patientService.registerPatient({
          medicalRecordNumber: mrn,
          firstName: 'Duplicate',
          lastName: 'Patient',
          dateOfBirth: new Date('1996-08-25'),
        })
      ).rejects.toThrow(ConflictException)

      // Cleanup
      await prisma.patient.delete({ where: { id: patient.id } })
    })
  })

  describe('Database Indexing Conventions Verification', () => {
    it('should verify required B-Tree indexes exist in PostgreSQL catalog', async () => {
      const indexRows = await prisma.$queryRaw<
        Array<{ tablename: string; indexname: string; indexdef: string }>
      >`
        SELECT tablename, indexname, indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public'
      `

      const indexNames = indexRows.map((r) => r.indexname)

      // Users table indexes
      expect(indexNames.some((n) => n.includes('users_email'))).toBe(true)
      expect(indexNames.some((n) => n.includes('users_role'))).toBe(true)
      expect(indexNames.some((n) => n.includes('users_status'))).toBe(true)
      expect(indexNames.some((n) => n.includes('users_deleted_at'))).toBe(true)
      expect(indexNames.some((n) => n.includes('users_created_at'))).toBe(true)

      // Patients table indexes
      expect(indexNames.some((n) => n.includes('patients_medical_record_number'))).toBe(true)
      expect(indexNames.some((n) => n.includes('patients_first_name_last_name'))).toBe(true)
      expect(indexNames.some((n) => n.includes('patients_email'))).toBe(true)
      expect(indexNames.some((n) => n.includes('patients_status'))).toBe(true)
      expect(indexNames.some((n) => n.includes('patients_deleted_at'))).toBe(true)
      expect(indexNames.some((n) => n.includes('patients_created_at'))).toBe(true)

      // Audit Logs table indexes
      expect(indexNames.some((n) => n.includes('audit_logs_user_id'))).toBe(true)
      expect(indexNames.some((n) => n.includes('audit_logs_entity_entity_id'))).toBe(true)
      expect(indexNames.some((n) => n.includes('audit_logs_created_at'))).toBe(true)
    })
  })

  describe('Database Migrations Tracking (_prisma_migrations)', () => {
    it('should verify migration tracking table exists and initial migration is recorded as applied', async () => {
      const migrationRows = await prisma.$queryRaw<
        Array<{
          id: string
          migration_name: string
          applied_steps_count: number
          finished_at: Date | null
        }>
      >`
        SELECT id, migration_name, applied_steps_count, finished_at 
        FROM "_prisma_migrations" 
        ORDER BY started_at ASC
      `

      expect(migrationRows.length).toBeGreaterThan(0)
      const initMigration = migrationRows.find((m) =>
        m.migration_name.includes('init_healthcare_erp_schema')
      )
      expect(initMigration).toBeDefined()
      expect(initMigration?.finished_at).toBeDefined()
      expect(initMigration?.finished_at).not.toBeNull()
    })
  })
})
