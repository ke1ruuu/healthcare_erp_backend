# Healthcare ERP Backend -- Database Migration Architecture & Workflow

This document establishes the official **Database Migration Workflow**, **Schema Evolution Policy**, and **Production Deployment Standards** for the Healthcare ERP Backend using PostgreSQL and Prisma ORM.

---

## 1. Overview & Architecture

In enterprise healthcare applications subject to regulatory compliance (HIPAA, GDPR, 21 CFR Part 11), database schema changes must be:
1. **Audited & Versioned**: Every DDL change is represented by a deterministic, timestamped SQL migration file tracked in Git under `prisma/migrations/`.
2. **Deterministic & Reversible**: Applied in strict chronological order and tracked in PostgreSQL via the `_prisma_migrations` catalog table.
3. **Zero Data Loss**: Direct schema pushes (`db push`) are strictly forbidden in production.

```
                  Local Development                      CI/CD / Production Deploy
                  ─────────────────                      ─────────────────────────
             Modify prisma/schema.prisma                       Git Release Push
                         │                                            │
                         ▼                                            ▼
              bun run db:migrate (dev)                    bun run db:migrate:deploy
                         │                                            │
                         ▼                                            ▼
      Generates prisma/migrations/<timestamp>_name/       Applies pending SQL migrations
                  migration.sql                                non-interactively
                         │                                            │
                         ▼                                            ▼
            Applied to Local PostgreSQL                  Recorded in _prisma_migrations
```

---

## 2. Migration Commands Reference

| Script Command | Native Command | Environment | Description |
|---|---|---|---|
| `bun run db:migrate` | `prisma migrate dev` | Development | Detects schema changes, generates timestamped migration SQL, applies it locally, and regenerates Prisma Client. |
| `bun run db:migrate:deploy` | `prisma migrate deploy` | CI/CD & Production | Non-interactively applies all pending migrations. Does not generate new files or reset tables. |
| `bun run db:migrate:status` | `prisma migrate status` | All | Verifies database sync state against migration history, detecting drift or unapplied migrations. |
| `bun run db:migrate:create` | `prisma migrate dev --create-only` | Development | Drafts a migration SQL file without immediately executing it, allowing custom SQL edits (e.g. data backfills). |
| `bun run db:migrate:reset` | `prisma migrate reset --force` | Local Testing | Drops the database, reapplies all migrations from scratch, and runs the seeder (`prisma/seed.ts`). |
| `bun run db:setup` | `bun run scripts/setup-db.ts` | Local Setup | Automated pre-flight health probe, TCP connectivity check, migration deployment, and seeding. |

---

## 3. Local Development Workflow

### Step 1: Modify `prisma/schema.prisma`
Add models, fields, enums, or indexes in `prisma/schema.prisma`.

### Step 2: Create and Apply Migration
```sh
bun run db:migrate
```
Prisma will prompt for a concise, descriptive name (e.g. `add_appointments_module` or `add_patient_insurance_fields`).

This creates:
```
prisma/migrations/
├── 20260828000000_init_healthcare_erp_schema/
│   └── migration.sql
└── 20260828120000_add_appointments_module/
    └── migration.sql
```

### Step 3: Verify TypeScript Client
The Prisma client is automatically regenerated (`node_modules/@prisma/client`). Run tests:
```sh
bun test
bun run typecheck
```

---

## 4. Production Deployment & CI/CD Pipeline

In automated pipelines (GitHub Actions, Docker builds, Kubernetes init containers):

```sh
# 1. Verify schema drift
bun run db:migrate:status

# 2. Apply pending migrations
bun run db:migrate:deploy

# 3. Start application service
bun run start
```

---

## 5. Schema Evolution & Zero-Downtime Policy (Expand-Contract Pattern)

To avoid locking clinical databases or breaking active application replicas during continuous deployment:

### Phase 1: Expand (Additive)
- Add new columns as **nullable** (`String?`) or with **safe defaults** (`@default(...)`).
- Deploy application version reading/writing both old and new columns.

### Phase 2: Migrate (Backfill)
- Backfill historical data in background workers or dedicated SQL scripts.

### Phase 3: Contract (Cleanup)
- Remove deprecated columns in a subsequent release after all active client instances are upgraded.

---

## 6. Disaster Recovery & Migration Drift Remediation

### Drift Detection
If manual changes were made to PostgreSQL directly without a migration:
```sh
bun run db:migrate:status
```

### Baselines on Existing Databases
If an existing production database has tables but lacks migration history:
```sh
bunx prisma migrate resolve --applied 20260828000000_init_healthcare_erp_schema
```
