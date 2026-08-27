# Healthcare ERP Backend — Engineering Conventions & Standards

This document establishes the official engineering standards, source-code conventions, file/module naming patterns, and architectural guidelines for the **Healthcare ERP Backend**.

All team members and contributors must adhere to these conventions to ensure maintainability, type-safety, testability, and healthcare regulatory compliance (HIPAA / GDPR / Auditability).

---

## Table of Contents
1. [Modular-Monolith Architecture](#1-modular-monolith-architecture)
2. [Domain Module Layering (Controller, Service, Repository)](#2-domain-module-layering-controller-service-repository)
3. [File Naming Conventions](#3-file-naming-conventions)
4. [Code & Identifier Naming Conventions](#4-code--identifier-naming-conventions)
5. [Prisma & Database Conventions](#5-prisma--database-conventions)
6. [API Design & Response Envelopes](#6-api-design--response-envelopes)
7. [TypeScript & Coding Best Practices](#7-typescript--coding-best-practices)
8. [Healthcare ERP & Compliance Rules](#8-healthcare-erp--compliance-rules)

---

## 1. Modular-Monolith Architecture

The system is architected as a **Modular-Monolith**. The entire application runs as a single deployable service on Bun, but the codebase is strictly segregated into autonomous, domain-driven modules under `src/modules/`.

### Modular-Monolith Principles
1. **Domain Encapsulation**: Each domain module (e.g. `auth`, `users`, `patients`, `appointments`, `billing`, `prescriptions`, `inventory`, `lab`, `audit-logs`) owns its business logic, database tables, and validation schemas.
2. **Explicit Inter-Domain Communication**: If module A (e.g. `billing`) needs data or operations from module B (e.g. `patients`), it must invoke module B's **Application Service** (`patientService.getPatientById(id)`). Modules must **NEVER** import or query another module's repository or database models directly.
3. **Shared Kernel / Core**: Global middlewares, type definitions, environment configuration, and pure utilities reside in `src/shared/`, `src/config/`, `src/db/`, and `src/middlewares/`.

```
src/
├── config/                     # Application configuration & env validation (Zod)
│   └── env.ts
├── db/                         # Prisma singleton client & connection lifecycle
│   └── prisma.ts
├── middlewares/                # Global / application-level middlewares
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── modules/                    # Autonomous Domain Modules
│   ├── auth/
│   │   ├── index.ts            # Public API barrel (Exports service, route, public DTOs)
│   │   ├── auth.route.ts       # API routing & endpoint definitions
│   │   ├── auth.controller.ts  # HTTP controller (request/response orchestration)
│   │   ├── auth.service.ts     # Application Service (business logic)
│   │   ├── auth.repository.ts  # Repository layer (database access)
│   │   ├── auth.dto.ts         # Zod schemas & TypeScript DTO types
│   │   └── auth.test.ts        # Domain module unit & integration tests
│   ├── patients/
│   │   ├── index.ts            # Public API barrel
│   │   ├── patient.route.ts
│   │   ├── patient.controller.ts
│   │   ├── patient.service.ts
│   │   ├── patient.repository.ts
│   │   ├── patient.dto.ts
│   │   └── patient.test.ts
│   └── ...
├── shared/                     # Shared cross-cutting utilities & helpers
│   ├── constants/              # Shared enums & constants
│   ├── types/                  # Global TypeScript types (Pagination, Context)
│   └── utils/                  # Pure utility functions (dates, crypto, formatting)
│       └── response.util.ts
├── routes/                     # Centralized top-level route aggregators
│   └── health.route.ts
└── index.ts                    # Application entrypoint & server config
```

---

## 2. Domain Module Layering (Controller, Service, Repository)

Every domain module is strictly divided into four distinct layers:

```
┌────────────────────────────────────────────────────────┐
│                   1. Route Layer                       │
│  (Defines URL endpoints, HTTP methods, middlewares)    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                2. API / Controller Layer               │
│  (Extracts parameters, validates DTOs, formats JSON)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             3. Application Service Layer               │
│  (Business rules, transactions, orchestration, audits) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  4. Repository Layer                   │
│  (Prisma queries, database access, data mapping)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   PostgreSQL Database                  │
└────────────────────────────────────────────────────────┘
```

### Layer Responsibility Matrix

| Layer | File Pattern | Responsibilities | Forbidden Patterns |
|---|---|---|---|
| **Route** | `<domain>.route.ts` | Declares URL paths, HTTP verbs, attaches auth/role middlewares, and mounts to controller methods. | ❌ No business logic.<br>❌ No direct service calls. |
| **API / Controller** | `<domain>.controller.ts` | Receives Hono `Context`, parses request params/body/query, invokes Application Service, and returns standardized response envelopes. | ❌ No database/Prisma queries.<br>❌ No domain business logic calculations. |
| **Application Service** | `<domain>.service.ts` | Orchestrates domain operations, coordinates database transactions, invokes repositories, triggers audit logs, and handles business validation. | ❌ Never references Hono `Context` (`c`).<br>❌ Never imports another module's repository directly. |
| **Repository** | `<domain>.repository.ts` | Encapsulates all Prisma ORM database queries (`create`, `findUnique`, `findMany`, `update`, `delete`, soft-delete). Returns plain data objects. | ❌ No HTTP or routing logic.<br>❌ No business decision rules. |
| **DTO / Schema** | `<domain>.dto.ts` | Defines Zod validation schemas and TypeScript types for input and output data contracts. | ❌ No database queries or side effects. |

---

## 3. File Naming Conventions

All files must follow **`kebab-case`** with a descriptive role suffix:

| Component | Convention | Example |
|---|---|---|
| **Route Definition** | `<feature>.route.ts` | `patient.route.ts`, `appointment.route.ts` |
| **Controller** | `<feature>.controller.ts` | `patient.controller.ts`, `auth.controller.ts` |
| **Application Service** | `<feature>.service.ts` | `patient.service.ts`, `billing.service.ts` |
| **Repository** | `<feature>.repository.ts` | `patient.repository.ts`, `user.repository.ts` |
| **Data Transfer Object / Schema** | `<feature>.dto.ts` | `patient.dto.ts`, `invoice.dto.ts` |
| **Middleware** | `<name>.middleware.ts` | `auth.middleware.ts`, `rate-limit.middleware.ts` |
| **Utility** | `<name>.util.ts` | `date.util.ts`, `response.util.ts` |
| **Type Definition** | `<name>.type.ts` | `pagination.type.ts`, `jwt.type.ts` |
| **Unit / Integration Test** | `<feature>.test.ts` | `patient.test.ts`, `auth.test.ts` |
| **Directory Names** | `kebab-case` | `medical-records/`, `lab-tests/`, `audit-logs/` |

---

## 4. Code & Identifier Naming Conventions

### Variables & Functions: `camelCase`
- **Variables**: `patientId`, `medicalRecordNumber`, `totalAmount`
- **Boolean Variables**: Must use prefixes such as `is`, `has`, `can`, `should`:
  - `isActive`, `hasPrescription`, `canDischarge`
- **Functions & Methods**: Must begin with a verb representing the action:
  - `getPatientById()`
  - `createInvoice()`
  - `verifyPassword()`
  - `calculatePrescriptionDosage()`

### Types, Interfaces, Enums & Classes: `PascalCase`
- **Classes**: `PatientService`, `PatientRepository`, `PatientController`
- **Interfaces / Types**:
  - Domain models: `Patient`, `AppointmentDetails`
  - DTO types: `CreatePatientDto`, `UpdatePatientDto`, `LoginResponseDto`
- **Enums**:
  - Enum name: `PascalCase` (e.g. `Role`, `AppointmentStatus`)
  - Enum members: `SCREAMING_SNAKE_CASE` (e.g. `SUPER_ADMIN`, `PENDING_PAYMENT`)

### Constants & Environment Variables: `SCREAMING_SNAKE_CASE`
- `DEFAULT_PAGE_SIZE`, `MAX_LOGIN_ATTEMPTS`, `JWT_SECRET`, `DATABASE_URL`

---

## 5. Prisma & Database Conventions

### Schema Guidelines
1. **Model Names**: `PascalCase` singular (e.g. `User`, `Patient`, `MedicalRecord`, `Prescription`).
2. **Table Names (`@@map`)**: `snake_case` plural (e.g. `@@map("users")`, `@@map("medical_records")`).
3. **Field Names**: `camelCase` in Prisma schema, mapped to `snake_case` in SQL via `@map`:
   ```prisma
   model MedicalRecord {
     id           String    @id @default(uuid())
     patientId    String    @map("patient_id")
     diagnosis    String
     createdAt    DateTime  @default(now()) @map("created_at")
     updatedAt    DateTime  @updatedAt @map("updated_at")
     deletedAt    DateTime? @map("deleted_at")

     @@map("medical_records")
   }
   ```
4. **Primary Keys**: Use UUIDv4 (`@default(uuid())`) or CUID for distributed safety.
5. **Foreign Keys**: Always indexed (`@@index([patientId])`) for performant join queries.
6. **Audit Timestamps**: Every table must have `createdAt` and `updatedAt`. Tables holding clinical or transactional data must include `deletedAt` for soft deletes.

---

## 6. API Design & Response Envelopes

### RESTful Routing Standards
- Base API Prefix: `/api/v1`
- Use plural resource nouns: `/api/v1/patients`, `/api/v1/appointments`
- Resource nesting should not exceed 2 levels: `/api/v1/patients/:id/medical-records`

| Method | Endpoint Pattern | Description | Success Code |
|---|---|---|---|
| `GET` | `/api/v1/patients` | List patients (paginated) | `200 OK` |
| `GET` | `/api/v1/patients/:id` | Get patient by ID | `200 OK` |
| `POST` | `/api/v1/patients` | Create new patient | `201 Created` |
| `PUT` / `PATCH` | `/api/v1/patients/:id` | Update patient | `200 OK` |
| `DELETE` | `/api/v1/patients/:id` | Soft delete patient | `200 OK` or `204 No Content` |

### Standardized JSON Response Envelope

#### 1. Success Response Format
```json
{
  "success": true,
  "data": {
    "id": "c8f2e219-5d46-4e59-9943-7ec41d8e1e77",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Patient created successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 2. Error Response Format
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    }
  ]
}
```

---

## 7. TypeScript & Coding Best Practices

1. **Path Aliasing**: Always import application code via the `@/*` alias (configured in `tsconfig.json`):
   ```ts
   // Correct
   import { prisma } from '@/db/prisma'
   import { env } from '@/config/env'

   // Avoid
   import { prisma } from '../../../db/prisma'
   ```
2. **Strict Typing**:
   - Avoid `any`. Use `unknown` or generics when types are dynamic.
   - Use Zod schemas as the single source of truth for DTO types (`type CreatePatientDto = z.infer<typeof createPatientSchema>`).
3. **Async / Await**:
   - Always use `async/await` instead of promise chains (`.then()/.catch()`).
   - Wrap external I/O and database operations in proper error handling.

---

## 8. Healthcare ERP & Compliance Rules

Because this is a Healthcare system dealing with sensitive medical data:

1. **Protected Health Information (PHI) & Logging**:
   - **NEVER** log patient names, diagnoses, medical record numbers, SSNs, credit card data, or passwords to terminal/log files.
   - Logs must only contain system-level metadata (HTTP method, route, status code, latency, error codes).
2. **Audit Trails**:
   - Any creation, modification, or soft-deletion of clinical records, prescriptions, or financial invoices must create an immutable entry in the `AuditLog` table.
3. **Soft Deletions**:
   - Clinical and financial records must **NEVER** be hard-deleted from the database.
   - Filter active records with `where: { deletedAt: null }`.
4. **Role-Based Access Control (RBAC)**:
   - Every protected route must specify the minimum required role (e.g. `DOCTOR`, `NURSE`, `ADMIN`, `SUPER_ADMIN`).
