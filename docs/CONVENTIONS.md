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
| **Route** | `<domain>.route.ts` | Declares URL paths, HTTP verbs, attaches auth/role middlewares, and mounts to controller methods. | [Forbidden] No business logic.<br>[Forbidden] No direct service calls. |
| **API / Controller** | `<domain>.controller.ts` | Receives Hono `Context`, parses request params/body/query, invokes Application Service, and returns standardized response envelopes. | [Forbidden] No database/Prisma queries.<br>[Forbidden] No domain business logic calculations. |
| **Application Service** | `<domain>.service.ts` | Orchestrates domain operations, coordinates database transactions, invokes repositories, triggers audit logs, and handles business validation. | [Forbidden] Never references Hono `Context` (`c`).<br>[Forbidden] Never imports another module's repository directly. |
| **Repository** | `<domain>.repository.ts` | Encapsulates all Prisma ORM database queries (`create`, `findUnique`, `findMany`, `update`, `delete`, soft-delete). Returns plain data objects. | [Forbidden] No HTTP or routing logic.<br>[Forbidden] No business decision rules. |
| **DTO / Schema** | `<domain>.dto.ts` | Defines Zod validation schemas and TypeScript types for input and output data contracts. | [Forbidden] No database queries or side effects. |

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

### 5.1 Common Identifiers Convention

Healthcare systems require a strict separation between **Internal Database Primary Keys** and **Human-Readable Business Identifiers**:

1. **Internal Primary Keys (System IDs)**:
   - Always use **UUID v4** (`String @id @default(uuid())`).
   - Globally unique, non-sequential, and unpredictable to prevent enumeration attacks and HIPAA metadata leakage.
   - Example: `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`

2. **Human-Readable Business Identifiers**:
   - Used in patient wristbands, printed prescriptions, invoices, and clinical communication.
   - Structured pattern: `PREFIX-YYYYMMDD-XXXX` (where `XXXX` is a randomized or sequence counter).
   - Standard domain prefixes:
     | Domain | Prefix | Example | Description |
     |---|---|---|---|
     | **Patients** | `MRN` | `MRN-20260828-4821` | Master Patient Index (Medical Record Number) |
     | **Appointments**| `APT` | `APT-20260828-1044` | Clinical booking identifier |
     | **Invoices / Billing** | `INV` | `INV-20260828-9201` | Financial billing invoice |
     | **Prescriptions** | `RX` | `RX-20260828-3310` | Pharmacy order number |
     | **Lab Tests** | `LAB` | `LAB-20260828-7019` | Laboratory diagnostic order |

---

### 5.2 Timestamp Conventions

All database tables must adhere to standard audit and temporal conventions:

1. **Standard Audit Columns**:
   ```prisma
   createdAt    DateTime  @default(now()) @map("created_at")
   updatedAt    DateTime  @updatedAt @map("updated_at")
   deletedAt    DateTime? @map("deleted_at")
   ```
2. **UTC ISO 8601 Storage**:
   - All dates and timestamps are stored in UTC (`TIMESTAMPTZ` in PostgreSQL).
   - APIs serialize dates as ISO 8601 strings (`2026-08-28T15:47:00.000Z`).
3. **Soft Deletion Policy**:
   - Healthcare ERP data must **never be hard-deleted** from production databases for medical audit and regulatory compliance (HIPAA / GDPR).
   - Soft deletion sets `deletedAt = new Date()`.
   - All standard service queries must include `where: { deletedAt: null }`.
   - Tables with soft deletion must include `@@index([deletedAt])` for query optimization.

---

### 5.3 Status Conventions

Every stateful domain model must manage lifecycle states through strongly typed Enums:

1. **Lifecycle State Enums**:
   - `UserStatus`: `ACTIVE`, `INACTIVE`, `SUSPENDED`
   - `PatientStatus`: `ACTIVE`, `INACTIVE`, `DECEASED`, `TRANSFERRED`
   - `AppointmentStatus`: `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`
   - `BillingStatus`: `DRAFT`, `PENDING_INSURANCE`, `PAID`, `OVERDUE`, `VOID`
2. **Default Status Rule**:
   - Newly created records must default to `ACTIVE` (or `DRAFT` / `SCHEDULED` for workflows requiring confirmation).
3. **State Transition Validation**:
   - Status changes must be validated in domain application services.
   - Significant status transitions (e.g. `SUSPENDED`, `DECEASED`, `CANCELLED`) must create an immutable entry in `audit_logs`.
4. **Performance Indexing**:
   - Always index status fields (`@@index([status])`).

---

### 5.4 Database Column & Table Naming Conventions

1. **Model Names**: `PascalCase` singular (`User`, `Patient`, `AuditLog`).
2. **Table Names (`@@map`)**: `snake_case` plural (`@@map("users")`, `@@map("patients")`, `@@map("audit_logs")`).
3. **Column Names (`@map`)**: `camelCase` in TypeScript/Prisma, mapped to `snake_case` in PostgreSQL:
   ```prisma
   medicalRecordNumber   String   @unique @map("medical_record_number")
   passwordHash          String   @map("password_hash")
   dateOfBirth           DateTime @map("date_of_birth")
   ```
4. **Foreign Keys**: Always indexed for performant relational queries (`@@index([userId])`, `@@index([patientId])`).

---

### 5.5 Foreign-Key Constraints & Referential Action Conventions

Foreign-key constraints enforce relational integrity at the PostgreSQL engine level. Every cross-table relation in Prisma must explicitly specify `onDelete` and `onUpdate` referential actions according to its clinical safety class:

1. **`SetNull` (Forensic & Audit Actor References)**:
   - Applied to historical tracking columns where the referenced record may be decommissioned, but the audit entry itself is legally immutable.
   - Example: `AuditLog.userId` referencing `User.id` with `onDelete: SetNull`.
   - Result: If a user record is removed, `user_id` becomes `NULL`, preserving the immutable timestamp, action, entity, IP address, and payload history.

2. **`Restrict` / `NoAction` (Clinical & Financial Data Protection)**:
   - Default policy for relational models where deleting the parent would cause medical or financial inconsistency.
   - Example: `Patient` cannot be removed if referenced by active `Prescription`, `Appointment`, or `Invoice` records.
   - Result: PostgreSQL rejects any deletion attempt, raising foreign-key violation `P2003` until child records are systematically archived or reassigned.

3. **`Cascade` (Strict Sub-Entity / Line-Item Composition)**:
   - Permitted exclusively for tightly coupled child records that have no independent clinical existence outside their aggregate root.
   - Example: `InvoiceItem` on `Invoice`, `PrescriptionItem` on `Prescription`.
   - Result: Deleting the parent invoice automatically removes its associated line items.

4. **Foreign Key Column Naming Standard**:
   - Always formatted as `camelCase` `<parentEntity>Id` in Prisma, mapped to `snake_case` `<parent_entity>_id` in PostgreSQL:
     ```prisma
     userId    String?  @map("user_id")
     patientId String   @map("patient_id")
     ```

---

### 5.6 Soft-Delete Strategy & Retention Lifecycle

In compliance with healthcare regulations (HIPAA Security Rule §164.312, 21 CFR Part 11, and GDPR Article 17 clinical exemptions), **production medical and operational records must never be hard-deleted from PostgreSQL tables**.

1. **Soft-Delete Implementation**:
   - Every stateful model includes a nullable timestamp:
     ```prisma
     deletedAt DateTime? @map("deleted_at")
     ```
   - Soft-delete operations update the record timestamp rather than executing SQL `DELETE`:
     ```ts
     await prisma.patient.update({
       where: { id },
       data: { deletedAt: new Date() },
     })
     ```
2. **Active Record Filtering Standard**:
   - All repository `find*`, `count`, and search methods must enforce active state filtering:
     ```ts
     where: { deletedAt: null, ...otherFilters }
     ```
3. **Audit & Event Emission**:
   - Performing a soft delete must record an entry in `audit_logs` (`action: "DELETE_<ENTITY>"`) and publish a domain event (`<entity>:deleted`).
4. **Entity Classification Matrix**:
   | Entity Class | Strategy | Examples | Rationale |
   |---|---|---|---|
   | **Clinical & Master Data** | **Soft-Delete** (`deletedAt`) | `User`, `Patient`, `Doctor`, `Appointment`, `Prescription`, `Invoice` | Regulatory provenance and legal medical audit retention. |
   | **Audit & Ledger Logs** | **Append-Only** (No Deletion) | `AuditLog`, `LedgerEntry`, `SecurityEvent` | Tamper-evident forensics; rows are permanently immutable. |
   | **Ephemeral & Sessions** | **Hard-Delete** (Physical Removal) | Verification codes, password reset tokens, rate-limit buckets | Security minimization of temporary credentials. |

---

### 5.7 Indexing Conventions & Performance Optimization

To guarantee sub-millisecond query execution across large patient databases, all PostgreSQL indexes must adhere to systematic conventions:

1. **Primary Key Indexes**:
   - Automatically generated unique B-Tree index on `id` (`UUID v4`).
2. **Foreign Key Indexes**:
   - **Mandatory**: Every foreign key column must have an explicit `@@index([foreignKey])`.
   - Eliminates table scans during SQL `JOIN`s and foreign-key referential checks:
     ```prisma
     @@index([userId])
     @@index([patientId])
     ```
3. **Soft-Delete & Status Indexes**:
   - Dedicated indexes on filtering predicates:
     ```prisma
     @@index([deletedAt])
     @@index([status])
     ```
4. **Composite Query Indexes**:
   - Multi-column indexes constructed in order of query cardinality:
     - Multi-column patient lookup: `@@index([firstName, lastName])`
     - Audit log entity targeting: `@@index([entity, entityId])`
     - Chronological sorting: `@@index([createdAt])`
5. **Index Naming & Engine Storage**:
   - Managed via Prisma schema and translated to standard PostgreSQL B-Tree indexes.

---

### 5.8 Unique Constraints & Business Key Rules

1. **Natural & Business Key Constraints**:
   - Distinct from internal `UUID` primary keys, business keys enforce real-world domain uniqueness:
     - `email String @unique` on `User`
     - `medicalRecordNumber String @unique @map("medical_record_number")` on `Patient`
2. **Uniqueness Across Soft-Deleted Records**:
   - In healthcare systems, critical business identifiers like `MRN` and staff `email` remain permanently unique across both active and soft-deleted states.
   - This prevents identity collisions, prevents reassignment of medical record histories, and preserves forensic continuity.
3. **Duplicate Handling & Error Mapping**:
   - When a unique constraint violation occurs (PostgreSQL error code `23505` / Prisma error code `P2002`), the application's centralized `error.middleware.ts` automatically converts it into a standardized `409 Conflict` response (`code: "DUPLICATE_RESOURCE"`).

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

All API responses strictly adhere to unified JSON envelope schemas defined in `src/shared/types/response.type.ts`:

#### 1. Success Response Format (`sendSuccess`, `sendCreated`)
```json
{
  "success": true,
  "data": {
    "id": "c8f2e219-5d46-4e59-9943-7ec41d8e1e77",
    "medicalRecordNumber": "MRN-20260827-4821",
    "firstName": "John",
    "lastName": "Doe"
  },
  "message": "Patient created successfully",
  "timestamp": "2026-08-27T12:30:00.000Z"
}
```

#### 2. Paginated Response Format (`sendPaginated`)
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Alice" },
    { "id": "2", "name": "Bob" }
  ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 55,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-08-27T12:30:00.000Z"
}
```

#### 3. Standardized Error Response Format (`sendError` & `errorHandler`)
```json
{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format",
      "code": "invalid_string"
    }
  ],
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "timestamp": "2026-08-27T12:30:00.000Z",
  "path": "/api/v1/patients"
}
```

### Pagination, Filtering, Sorting & Searching Standards

All listing endpoints (`GET /api/v1/<domain>`) adhere to standard query parameter rules provided by `@/shared/types/pagination.type` and `@/shared/utils/query.util`:

| Concern | Query Parameters | Default | Description & Example |
|---|---|---|---|
| **Pagination** | `page`, `limit` | `page=1`, `limit=20` | 1-indexed pagination. Max `limit=100`. Example: `?page=2&limit=25` |
| **Sorting** | `sortBy`, `sortOrder` | `sortBy=createdAt`, `sortOrder=desc` | Validated against domain whitelist (`USER_SORTABLE_FIELDS`, `PATIENT_SORTABLE_FIELDS`). `sortOrder`: `asc` or `desc`. Example: `?sortBy=lastName&sortOrder=asc` |
| **Searching** | `search` | None | Sanitized string matched case-insensitively across multi-column text fields (e.g. name, email, MRN). Example: `?search=doe` |
| **Date Range** | `startDate`, `endDate` | None | Supports `YYYY-MM-DD` and ISO 8601 strings. Bounds clamped to end of day. Example: `?startDate=2026-01-01&endDate=2026-06-30` |
| **Domain Filters** | Status, Role, Gender, etc. | None | Strongly typed enum filters. Example: `?status=ACTIVE&gender=FEMALE` |

### Request Correlation IDs (`X-Request-ID`) & Structured Logging
- **Correlation Header**: Every incoming request is stamped with a UUID `X-Request-ID` and `X-Correlation-ID` header. If passed by the client or API gateway, the existing ID is preserved; otherwise, a cryptographically secure UUID is generated.
- **Envelope Tracing**: The `requestId` is included in all success and error JSON envelopes and response headers.
- **Structured Logging**: All HTTP requests and responses are logged in high precision with `[timestamp] [requestId] METHOD PATH -> STATUS (LATENCYms)`.

### Request Validation Rules (`validateBody`, `validateQuery`, `validateParam`)
- **Body Validation**: Attach `validateBody(schema)` middleware on `POST` and `PATCH` routes. Validated payload is accessible via `c.get('validatedBody')`.
- **Query Validation**: Attach `validateQuery(schema)` middleware on `GET` listing routes.
- **Parameter Validation**: Attach `validateParam(schema)` middleware on routes with dynamic parameters (e.g. UUID, MRN).
- **Exceptions**: Domain services throw typed `AppException` subclasses (`NotFoundException`, `ConflictException`, `UnauthorizedException`, `ForbiddenException`, `ValidationException`), which are caught and formatted automatically by the global `errorHandler`.
- **404 Handling**: Unmatched routes trigger `notFoundHandler`, returning a 404 `RESOURCE_NOT_FOUND` error envelope with `requestId`.

### Authentication Provider & Authenticated Session Validation
- **Token Architecture**: Dual-token architecture with short-lived JWT Access Tokens (15 minutes, HMAC-SHA256) and long-lived Database Refresh Tokens (7 days, opaque with rotation).
- **Session Lifecycle & Revocation**:
  - `Session` model in PostgreSQL persists `userId`, `refreshToken`, `userAgent`, `ipAddress`, `expiresAt`, `revokedAt`.
  - Logging out immediately marks `revokedAt = now()`.
  - Password updates immediately revoke all active sessions for that user.
  - Refresh operations rotate the refresh token, revoking the previous session and creating a new session record.
- **Authentication Middlewares**:
  - `requireAuth`: Validates `Bearer <token>` in `Authorization` header, verifies signature and expiration, verifies user active state in DB, and injects `user` (`SessionUser`) and `userId` into context. Automatically resolves active `organization` and `branch` context from user defaults or `X-Organization-ID` / `X-Branch-ID` headers.
  - `requireRoles(...roles)`: RBAC authorization guard ensuring the authenticated staff member possesses one of the allowed roles.
  - `optionalAuth`: Extracts session user if a valid token is present without rejecting unauthenticated requests.
  - `requireOrganization`: Strictly requires valid and active Organization context; blocks unauthorized cross-tenant requests for non-SUPER_ADMIN users.
  - `requireBranch`: Strictly requires valid and active Branch context; ensures the branch belongs to the active organization and enforces branch access boundaries.
  - `requireTenantContext`: Composed middleware enforcing both Organization and Branch contexts.
- **Security Prohibitions**: Passwords must be hashed using Bcrypt (`Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 })`). Raw passwords and password hashes must NEVER be returned in response payloads or logged.

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
