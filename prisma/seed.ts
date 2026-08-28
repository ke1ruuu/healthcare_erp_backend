import { PrismaClient, Role, UserStatus, Gender, BloodType, PatientStatus, OrganizationStatus, BranchStatus } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Password@123'

const SEED_ORGANIZATIONS = [
  {
    name: 'Apex Healthcare Group',
    code: 'ORG-APEX',
    description: 'Premier integrated tertiary healthcare network',
    status: OrganizationStatus.ACTIVE,
  },
  {
    name: 'Metro Health System',
    code: 'ORG-METRO',
    description: 'Urban medical centers and outpatient network',
    status: OrganizationStatus.ACTIVE,
  },
  {
    name: 'St. Jude Medical Trust',
    code: 'ORG-STJUDE',
    description: 'Community clinics and diagnostic centers',
    status: OrganizationStatus.ACTIVE,
  },
]

const SEED_BRANCHES = [
  {
    orgCode: 'ORG-APEX',
    name: 'Apex Main Hospital Campus',
    code: 'BR-APEX-MAIN',
    address: '100 Medical Center Blvd, Metro City',
    phoneNumber: '+1-555-1000',
    email: 'main@apex-health.local',
    status: BranchStatus.ACTIVE,
  },
  {
    orgCode: 'ORG-APEX',
    name: 'Apex Westside Specialist Clinic',
    code: 'BR-APEX-WEST',
    address: '450 Westside Ave, Metro City',
    phoneNumber: '+1-555-1001',
    email: 'westside@apex-health.local',
    status: BranchStatus.ACTIVE,
  },
  {
    orgCode: 'ORG-METRO',
    name: 'Metro General Hospital',
    code: 'BR-METRO-GEN',
    address: '200 Downtown Plaza, Metro City',
    phoneNumber: '+1-555-2000',
    email: 'general@metro-health.local',
    status: BranchStatus.ACTIVE,
  },
  {
    orgCode: 'ORG-METRO',
    name: 'Metro Outpatient Care Center',
    code: 'BR-METRO-OUT',
    address: '88 Suburbia Way, Metro City',
    phoneNumber: '+1-555-2001',
    email: 'outpatient@metro-health.local',
    status: BranchStatus.ACTIVE,
  },
  {
    orgCode: 'ORG-STJUDE',
    name: 'St. Jude Central Hospital',
    code: 'BR-STJUDE-CTR',
    address: '300 Saint Jude Way, Metro City',
    phoneNumber: '+1-555-3000',
    email: 'central@stjude-trust.local',
    status: BranchStatus.ACTIVE,
  },
  {
    orgCode: 'ORG-STJUDE',
    name: 'St. Jude Diagnostic Center',
    code: 'BR-STJUDE-DIAG',
    address: '12 Lab Parkway, Metro City',
    phoneNumber: '+1-555-3001',
    email: 'diagnostics@stjude-trust.local',
    status: BranchStatus.ACTIVE,
  },
]

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
]

const ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.DOCTOR,
  Role.NURSE,
  Role.PHARMACIST,
  Role.RECEPTIONIST,
  Role.LAB_TECHNICIAN,
  Role.ACCOUNTANT,
]

const GENDERS: Gender[] = [Gender.MALE, Gender.FEMALE, Gender.OTHER]
const BLOOD_TYPES: BloodType[] = [
  BloodType.A_POSITIVE, BloodType.A_NEGATIVE, BloodType.B_POSITIVE, BloodType.B_NEGATIVE,
  BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE,
]

async function main() {
  console.log('Starting comprehensive Healthcare ERP database seeding...')

  const passwordHash = await Bun.password.hash(DEFAULT_PASSWORD, {
    algorithm: 'bcrypt',
    cost: 10,
  })

  // 1. Seed Organizations
  const orgMap = new Map<string, string>()
  for (const org of SEED_ORGANIZATIONS) {
    const upserted = await prisma.organization.upsert({
      where: { code: org.code },
      update: { name: org.name, description: org.description, status: org.status },
      create: { name: org.name, code: org.code, description: org.description, status: org.status },
    })
    orgMap.set(org.code, upserted.id)
  }

  // 2. Seed Branches
  const branchMap = new Map<string, string>()
  const branchIds: string[] = []
  for (const br of SEED_BRANCHES) {
    const orgId = orgMap.get(br.orgCode)!
    const upserted = await prisma.branch.upsert({
      where: {
        organizationId_code: {
          organizationId: orgId,
          code: br.code,
        },
      },
      update: {
        name: br.name,
        address: br.address,
        phoneNumber: br.phoneNumber,
        email: br.email,
        status: br.status,
      },
      create: {
        organizationId: orgId,
        name: br.name,
        code: br.code,
        address: br.address,
        phoneNumber: br.phoneNumber,
        email: br.email,
        status: br.status,
      },
    })
    branchMap.set(br.code, upserted.id)
    branchIds.push(upserted.id)
  }

  const orgIds = Array.from(orgMap.values())

  // 3. Seed Users (108 Staff accounts across all 8 roles, linked to Organizations and Branches)
  const seededUserIds: string[] = []

  // Core administrative accounts
  const coreAccounts = [
    { email: 'superadmin@healthcare-erp.local', first: 'System', last: 'SuperAdmin', role: Role.SUPER_ADMIN, org: null, branch: null },
    { email: 'admin.apex@healthcare-erp.local', first: 'Apex', last: 'Admin', role: Role.ADMIN, org: orgIds[0], branch: branchIds[0] },
    { email: 'admin.metro@healthcare-erp.local', first: 'Metro', last: 'Admin', role: Role.ADMIN, org: orgIds[1], branch: branchIds[2] },
    { email: 'admin.stjude@healthcare-erp.local', first: 'StJude', last: 'Admin', role: Role.ADMIN, org: orgIds[2], branch: branchIds[4] },
    { email: 'doctor.smith@healthcare-erp.local', first: 'John', last: 'Smith', role: Role.DOCTOR, org: orgIds[0], branch: branchIds[0] },
    { email: 'nurse.sarah@healthcare-erp.local', first: 'Sarah', last: 'Connor', role: Role.NURSE, org: orgIds[0], branch: branchIds[0] },
    { email: 'pharmacist.david@healthcare-erp.local', first: 'David', last: 'Kim', role: Role.PHARMACIST, org: orgIds[0], branch: branchIds[1] },
    { email: 'receptionist.clara@healthcare-erp.local', first: 'Clara', last: 'Oswald', role: Role.RECEPTIONIST, org: orgIds[1], branch: branchIds[2] },
  ]

  for (const acc of coreAccounts) {
    const upserted = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        firstName: acc.first,
        lastName: acc.last,
        role: acc.role,
        organizationId: acc.org,
        branchId: acc.branch,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: acc.email,
        passwordHash,
        firstName: acc.first,
        lastName: acc.last,
        role: acc.role,
        organizationId: acc.org,
        branchId: acc.branch,
        status: UserStatus.ACTIVE,
      },
    })
    seededUserIds.push(upserted.id)
  }

  // Generate 100 additional staff members
  for (let i = 1; i <= 100; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i * 3) % LAST_NAMES.length]
    const role = ROLES[i % ROLES.length]
    const email = `staff.${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@healthcare-erp.local`
    const orgId = orgIds[i % orgIds.length]
    const branchId = branchIds[i % branchIds.length]

    const upserted = await prisma.user.upsert({
      where: { email },
      update: {
        firstName: fn,
        lastName: ln,
        role,
        organizationId: orgId,
        branchId: branchId,
        status: UserStatus.ACTIVE,
      },
      create: {
        email,
        passwordHash,
        firstName: fn,
        lastName: ln,
        role,
        organizationId: orgId,
        branchId: branchId,
        status: UserStatus.ACTIVE,
      },
    })
    seededUserIds.push(upserted.id)
  }

  // 4. Seed Patients (106 realistic patients)
  const seededPatientIds: string[] = []
  for (let i = 1; i <= 106; i++) {
    const fn = FIRST_NAMES[(i * 2) % FIRST_NAMES.length]
    const ln = LAST_NAMES[(i * 5) % LAST_NAMES.length]
    const mrn = `MRN-20260828-${String(i).padStart(4, '0')}`
    const email = `patient.${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@patients.local`
    const phone = `+1-555-${String(2000 + i).padStart(4, '0')}`
    const gender = GENDERS[i % GENDERS.length]
    const bloodType = BLOOD_TYPES[i % BLOOD_TYPES.length]
    const birthYear = 1940 + (i % 60)
    const birthMonth = (i % 12) + 1
    const birthDay = (i % 28) + 1
    const orgId = orgIds[i % orgIds.length]
    const branchId = branchIds[i % branchIds.length]

    const upserted = await prisma.patient.upsert({
      where: { medicalRecordNumber: mrn },
      update: {
        firstName: fn,
        lastName: ln,
        email,
        phoneNumber: phone,
        organizationId: orgId,
        branchId: branchId,
      },
      create: {
        medicalRecordNumber: mrn,
        firstName: fn,
        lastName: ln,
        email,
        phoneNumber: phone,
        dateOfBirth: new Date(`${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`),
        gender,
        bloodType,
        status: PatientStatus.ACTIVE,
        address: `${100 + i} Medical Blvd, Suite ${i}, Health City`,
        emergencyContactName: `${LAST_NAMES[(i + 1) % LAST_NAMES.length]} Contact`,
        emergencyContactPhone: `+1-555-${String(8000 + i).padStart(4, '0')}`,
        organizationId: orgId,
        branchId: branchId,
      },
    })
    seededPatientIds.push(upserted.id)
  }

  // 5. Seed Audit Logs (100 structured forensic audit entries)
  const currentLogsCount = await prisma.auditLog.count()
  if (currentLogsCount < 100) {
    const auditActions = [
      'USER_LOGIN',
      'USER_LOGOUT',
      'CREATE_USER',
      'UPDATE_USER',
      'REGISTER_PATIENT',
      'UPDATE_PATIENT',
      'VIEW_PATIENT_RECORD',
      'RECORD_ENCOUNTER',
      'SYSTEM_BACKUP',
    ]

    const logsToCreate = []
    for (let i = 1; i <= 100; i++) {
      const action = auditActions[i % auditActions.length]
      const staffId = seededUserIds[i % seededUserIds.length]
      const patientId = seededPatientIds[i % seededPatientIds.length]

      logsToCreate.push({
        userId: staffId,
        action,
        entity: action.includes('PATIENT') ? 'Patient' : 'User',
        entityId: action.includes('PATIENT') ? patientId : staffId,
        details: {
          seedIndex: i,
          eventSource: 'seed_pipeline',
          ip: `192.168.1.${(i % 250) + 1}`,
        },
        ipAddress: `192.168.1.${(i % 250) + 1}`,
        userAgent: 'Mozilla/5.0 (Healthcare ERP Staff Client)',
      })
    }

    await prisma.auditLog.createMany({
      data: logsToCreate,
    })
  }

  console.log(`Successfully seeded:`)
  console.log(`- 3 Organizations (${SEED_ORGANIZATIONS.map((o) => o.name).join(', ')})`)
  console.log(`- 6 Branches (${SEED_BRANCHES.map((b) => b.code).join(', ')})`)
  console.log(`- ${seededUserIds.length} Users`)
  console.log(`- ${seededPatientIds.length} Patients`)
  console.log(`- 100+ Forensic Audit Logs`)
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
