#!/usr/bin/env bun
import { env } from '@/config/env'
import { prisma } from '@/db/prisma'

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 5432,
      user: decodeURIComponent(parsed.username || 'postgres'),
      password: decodeURIComponent(parsed.password || 'postgres'),
      database: parsed.pathname.replace(/^\//, '') || 'healthcare_erp',
    }
  } catch {
    return {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'healthcare_erp',
    }
  }
}

async function main() {
  console.log('===========================================================')
  console.log('Healthcare ERP -- PostgreSQL Local Setup & Verification')
  console.log('===========================================================\n')

  const dbConfig = parseDatabaseUrl(env.DATABASE_URL)
  console.log(`Checking PostgreSQL connection at ${dbConfig.host}:${dbConfig.port}...`)

  // Step 1: Check server connectivity via TCP probe
  let serverReachable = false
  try {
    const socket = await Bun.connect({
      hostname: dbConfig.host,
      port: dbConfig.port,
      socket: {
        data() {},
        open(ws) {
          serverReachable = true
          ws.end()
        },
        error() {},
      },
    })
    serverReachable = true
    socket.end()
  } catch {
    serverReachable = false
  }

  if (!serverReachable) {
    console.error(`[ERROR] Could not connect to PostgreSQL on ${dbConfig.host}:${dbConfig.port}.`)
    console.log('\nTip: If you have Docker installed, you can start PostgreSQL with:')
    console.log('   docker compose up -d')
    console.log('   Or start your local PostgreSQL service via Homebrew:')
    console.log('   brew services start postgresql@18\n')
    process.exit(1)
  }

  console.log('[OK] PostgreSQL server is reachable on TCP port.')

  // Step 2: Run Prisma Migration Deployment & Sync
  console.log('\nApplying pending Prisma migrations...')
  const migrateProc = Bun.spawnSync(['bunx', 'prisma', 'migrate', 'deploy'], {
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  if (migrateProc.exitCode !== 0) {
    console.error('[ERROR] Failed to apply Prisma migrations.')
    console.error(migrateProc.stderr.toString())
    process.exit(1)
  }
  console.log('[OK] All database migrations applied successfully.')

  // Step 3: Verify Prisma Client connectivity and probe latency
  console.log('\nProbing database connection via Prisma...')
  const start = performance.now()
  await prisma.$queryRaw`SELECT 1`
  const latency = (performance.now() - start).toFixed(2)
  console.log(`[OK] Database query probe successful! Latency: ${latency}ms`)

  // Step 4: Check and Seed Default Records if needed
  const userCount = await prisma.user.count()
  const patientCount = await prisma.patient.count()
  const auditLogCount = await prisma.auditLog.count()

  console.log('\nCurrent Database Statistics:')
  console.log(`   - Users / Staff Accounts: ${userCount}`)
  console.log(`   - Patients Registered:     ${patientCount}`)
  console.log(`   - Audit Log Entries:       ${auditLogCount}`)

  if (userCount === 0) {
    console.log('\nUsers table is empty. Running database seeder...')
    const seedProc = Bun.spawnSync(['bun', 'run', 'prisma/seed.ts'], {
      env: process.env,
      stdout: 'inherit',
      stderr: 'inherit',
    })

    if (seedProc.exitCode === 0) {
      console.log('[OK] Seed completed successfully.')
    }
  }

  console.log('\n===========================================================')
  console.log('PostgreSQL Database Setup is Complete & Ready to Use!')
  console.log('===========================================================\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('[ERROR] Fatal error during database setup:', err)
  process.exit(1)
})
