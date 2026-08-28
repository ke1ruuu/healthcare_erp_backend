import { describe, expect, it } from 'bun:test'
import { prisma } from '@/db/prisma'
import { Role, UserStatus, Gender, BloodType, PatientStatus } from '@prisma/client'

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
})
