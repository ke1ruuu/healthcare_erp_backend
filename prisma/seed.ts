import { PrismaClient, Role, UserStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedUser {
  email: string
  firstName: string
  lastName: string
  role: Role
  phoneNumber: string
  status: UserStatus
}

const DEFAULT_PASSWORD = 'Password@123'

const SEED_USERS: SeedUser[] = [
  {
    email: 'superadmin@healthcare-erp.local',
    firstName: 'System',
    lastName: 'SuperAdmin',
    role: Role.SUPER_ADMIN,
    phoneNumber: '+1-555-0100',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'admin@healthcare-erp.local',
    firstName: 'Hospital',
    lastName: 'Admin',
    role: Role.ADMIN,
    phoneNumber: '+1-555-0101',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'doctor.smith@healthcare-erp.local',
    firstName: 'John',
    lastName: 'Smith',
    role: Role.DOCTOR,
    phoneNumber: '+1-555-0102',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'nurse.sarah@healthcare-erp.local',
    firstName: 'Sarah',
    lastName: 'Connor',
    role: Role.NURSE,
    phoneNumber: '+1-555-0103',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'pharmacist.david@healthcare-erp.local',
    firstName: 'David',
    lastName: 'Kim',
    role: Role.PHARMACIST,
    phoneNumber: '+1-555-0104',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'receptionist.clara@healthcare-erp.local',
    firstName: 'Clara',
    lastName: 'Oswald',
    role: Role.RECEPTIONIST,
    phoneNumber: '+1-555-0105',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'labtech.james@healthcare-erp.local',
    firstName: 'James',
    lastName: 'Wilson',
    role: Role.LAB_TECHNICIAN,
    phoneNumber: '+1-555-0106',
    status: UserStatus.ACTIVE,
  },
  {
    email: 'accountant.emma@healthcare-erp.local',
    firstName: 'Emma',
    lastName: 'Watson',
    role: Role.ACCOUNTANT,
    phoneNumber: '+1-555-0107',
    status: UserStatus.ACTIVE,
  },
]

async function main() {
  console.log('Starting database seeding...')

  const passwordHash = await Bun.password.hash(DEFAULT_PASSWORD, {
    algorithm: 'bcrypt',
    cost: 10,
  })

  const seededUsers = []

  for (const user of SEED_USERS) {
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        status: user.status,
      },
      create: {
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        status: user.status,
      },
    })
    seededUsers.push({
      Email: upserted.email,
      Name: `${upserted.firstName} ${upserted.lastName}`,
      Role: upserted.role,
      Status: upserted.status,
    })
  }

  // Create initial audit log
  const adminUser = await prisma.user.findUnique({
    where: { email: 'superadmin@healthcare-erp.local' },
  })

  if (adminUser) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'SYSTEM_SEED',
        entity: 'System',
        entityId: 'initial-seed',
        details: {
          seededUserCount: seededUsers.length,
          timestamp: new Date().toISOString(),
        },
        userAgent: 'Prisma Seeder Script',
      },
    })
  }

  console.log('Seeded users successfully:')
  console.table(seededUsers)
  console.log(`Default password for all seeded accounts: ${DEFAULT_PASSWORD}\n`)
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
