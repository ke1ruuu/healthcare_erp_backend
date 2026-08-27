# Healthcare ERP Backend — Modular-Monolith Architecture

This document describes the architectural layout, domain layering, request lifecycle, and data flow of the **Healthcare ERP Backend**.

---

## 1. High-Level Modular-Monolith Architecture

The system is designed as a **Modular-Monolith** built on **Bun**, **Hono**, **Prisma ORM**, and **PostgreSQL**.

```mermaid
graph TD
    Client[HTTP Client / Frontend SPA] -->|HTTP/REST Request| Hono[Hono Application]
    
    subgraph Global Middleware Pipeline
        Hono --> Logger[Logger Middleware]
        Logger --> SecureHeaders[Secure Headers]
        SecureHeaders --> CORS[CORS Handler]
        CORS --> Auth[Auth & RBAC Middleware]
    end
    
    subgraph Domain Module Layering
        Auth --> Route[1. Route Layer (*.route.ts)]
        Route --> Validator[Zod DTO Validator]
        Validator --> Controller[2. API / Controller Layer (*.controller.ts)]
        Controller --> Service[3. Application Service Layer (*.service.ts)]
        Service --> Repository[4. Repository Layer (*.repository.ts)]
    end
    
    subgraph Data Access Layer
        Repository --> Prisma[Prisma Client Singleton]
        Prisma --> DB[(PostgreSQL Database)]
    end
```

---

## 2. Request Lifecycle & Layer Breakdown

1. **HTTP Request Entry (`src/index.ts`)**:
   - The request hits the main Hono application instance.
   - Global middlewares run: `logger()`, `secureHeaders()`, `prettyJSON()`, `cors()`.

2. **Route Match & Authorization (`src/modules/<domain>/<domain>.route.ts`)**:
   - Matches the URL path (e.g. `/api/v1/patients/:id`).
   - Runs route-level middlewares (e.g., JWT authentication, role check `requireRoles([Role.DOCTOR, Role.ADMIN])`).
   - Validates incoming body / query / params with Zod schemas from `<domain>.dto.ts`.

3. **Controller Execution (`src/modules/<domain>/<domain>.controller.ts`)**:
   - Extracts validated parameters, body, and query from the Hono context.
   - Calls the domain's **Application Service** (e.g. `patientService.getPatientById(id)`).
   - Formats the standardized JSON envelope (`{ success: true, data: ... }`).

4. **Application Service Execution (`src/modules/<domain>/<domain>.service.ts`)**:
   - Implements domain rules, calculations, permissions, and orchestration.
   - Calls the domain's **Repository** for database operations (e.g. `patientRepository.findById(id)`).
   - Coordinates database transactions (`prisma.$transaction`) across operations.
   - Records audit logs for mutating actions via the `auditLog` repository/service.

5. **Repository Execution (`src/modules/<domain>/<domain>.repository.ts`)**:
   - Directly executes Prisma Client queries (`create`, `findUnique`, `findMany`, `update`, `delete`).
   - Encapsulates database-specific query logic (filtering out `deletedAt: null` for soft deletes, eager joins, ordering).

6. **Error & Exception Handling (`src/middlewares/error.middleware.ts`)**:
   - Any thrown `HTTPException` or runtime error bubbles up to `app.onError()`.
   - Formats a consistent, sanitized error JSON response without leaking internal stack traces in production.

---

## 3. Standard Domain Module Template

When creating a new domain module (e.g. `src/modules/patients/`), implement the complete 4-layer structure:

### 1. DTO & Validation Schema (`patient.dto.ts`)
```ts
import { z } from 'zod'

export const createPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
})

export const updatePatientSchema = createPatientSchema.partial()

export type CreatePatientDto = z.infer<typeof createPatientSchema>
export type UpdatePatientDto = z.infer<typeof updatePatientSchema>
```

### 2. Repository Layer (`patient.repository.ts`)
```ts
import { prisma } from '@/db/prisma'
import type { CreatePatientDto, UpdatePatientDto } from './patient.dto'

export class PatientRepository {
  async findById(id: string) {
    return prisma.patient.findFirst({
      where: { id, deletedAt: null },
    })
  }

  async findByEmail(email: string) {
    return prisma.patient.findFirst({
      where: { email, deletedAt: null },
    })
  }

  async findAll(skip = 0, take = 20) {
    return prisma.patient.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    })
  }

  async count() {
    return prisma.patient.count({
      where: { deletedAt: null },
    })
  }

  async create(data: CreatePatientDto) {
    return prisma.patient.create({ data })
  }

  async update(id: string, data: UpdatePatientDto) {
    return prisma.patient.update({
      where: { id },
      data,
    })
  }

  async softDelete(id: string) {
    return prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

export const patientRepository = new PatientRepository()
```

### 3. Application Service Layer (`patient.service.ts`)
```ts
import { HTTPException } from 'hono/http-exception'
import { patientRepository, type PatientRepository } from './patient.repository'
import type { CreatePatientDto, UpdatePatientDto } from './patient.dto'
import { prisma } from '@/db/prisma'

export class PatientService {
  constructor(private readonly repo: PatientRepository = patientRepository) {}

  async getPatientById(id: string) {
    const patient = await this.repo.findById(id)
    if (!patient) {
      throw new HTTPException(404, { message: 'Patient not found' })
    }
    return patient
  }

  async listPatients(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [patients, total] = await Promise.all([
      this.repo.findAll(skip, limit),
      this.repo.count(),
    ])

    return {
      patients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async createPatient(data: CreatePatientDto, actorId: string) {
    const existing = await this.repo.findByEmail(data.email)
    if (existing) {
      throw new HTTPException(409, { message: 'Patient with this email already exists' })
    }

    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({ data })

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'CREATE_PATIENT',
          entity: 'Patient',
          entityId: patient.id,
        },
      })

      return patient
    })
  }

  async deletePatient(id: string, actorId: string) {
    await this.getPatientById(id)

    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      await tx.auditLog.create({
        data: {
          userId: actorId,
          action: 'DELETE_PATIENT',
          entity: 'Patient',
          entityId: id,
        },
      })

      return patient
    })
  }
}

export const patientService = new PatientService()
```

### 4. API / Controller Layer (`patient.controller.ts`)
```ts
import type { Context } from 'hono'
import { patientService, type PatientService } from './patient.service'
import type { CreatePatientDto, UpdatePatientDto } from './patient.dto'

export class PatientController {
  constructor(private readonly service: PatientService = patientService) {}

  async getPatient(c: Context) {
    const id = c.req.param('id')
    const patient = await this.service.getPatientById(id)

    return c.json({
      success: true,
      data: patient,
    })
  }

  async listPatients(c: Context) {
    const page = Number(c.req.query('page') || '1')
    const limit = Number(c.req.query('limit') || '20')
    const result = await this.service.listPatients(page, limit)

    return c.json({
      success: true,
      data: result.patients,
      meta: result.meta,
    })
  }

  async createPatient(c: Context) {
    const body = await c.req.json<CreatePatientDto>()
    const user = c.get('user') || { id: 'system' }

    const patient = await this.service.createPatient(body, user.id)
    return c.json(
      {
        success: true,
        data: patient,
        message: 'Patient registered successfully',
      },
      201
    )
  }

  async deletePatient(c: Context) {
    const id = c.req.param('id')
    const user = c.get('user') || { id: 'system' }

    await this.service.deletePatient(id, user.id)
    return c.json({
      success: true,
      message: 'Patient deleted successfully',
    })
  }
}

export const patientController = new PatientController()
```

### 5. Route Layer (`patient.route.ts`)
```ts
import { Hono } from 'hono'
import { patientController } from './patient.controller'

export const patientRoute = new Hono()

patientRoute.get('/', (c) => patientController.listPatients(c))
patientRoute.get('/:id', (c) => patientController.getPatient(c))
patientRoute.post('/', (c) => patientController.createPatient(c))
patientRoute.delete('/:id', (c) => patientController.deletePatient(c))
```
