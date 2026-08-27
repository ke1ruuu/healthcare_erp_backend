# Changelog

All notable changes and completed milestones for the **Healthcare ERP Backend** are documented in this file and in the dedicated `changelogs/` directory.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Releases

### [v1.0.3](changelogs/v1.0.3.md) — 2026-08-27
- **API Root & URI Versioning**: Created root discovery (`GET /`), version aggregator (`GET /api/v1`), and central route registrar (`src/routes/index.ts`).
- **Breaking Change Detection**: Implemented `scripts/check-api-drift.ts` (`bun run check:api-drift`) enforcing contract backward compatibility.
- **Request Validation**: Implemented `validateBody`, `validateQuery`, and `validateParam` middlewares with field-level structured error formatting.
- **Response Envelopes**: Established standard envelopes (`sendSuccess`, `sendCreated`, `sendPaginated`, `sendNoContent`, `sendError`).
- **Centralized Error & 404 Handlers**: Built global `errorHandler` catching `AppException` hierarchy, `ZodError`, Prisma database errors, and structured `notFoundHandler`.
- **Request Correlation IDs**: Implemented `requestIdMiddleware` injecting `X-Request-ID` and `X-Correlation-ID` across contexts, headers, and error envelopes.
- **High-Precision Logging**: Implemented `requestLoggerMiddleware` with microsecond latency measurements.
- **Pagination, Filtering, Sorting & Searching**: Created `src/shared/types/pagination.type.ts` and `src/shared/utils/query.util.ts` supporting multi-column search, whitelisted sorting, and date ranges.
- **Monitoring Dashboard**: Created React 19 + Vite dashboard SPA (`dashboard/`) with real-time telemetry endpoint (`/api/v1/telemetry`).
- **OpenAPI 3.1 & Swagger UI**: Updated documentation to version `1.0.3`.

### [v1.0.2](changelogs/v1.0.2.md) — 2026-08-27
- **Architecture**: Formalized Modular-Monolith and Domain-Module architecture with strict 4-tier layer isolation (Application Service, Repository, Controller, DTO).
- **Module Boundaries & Ownerships**: Defined domain taxonomy, single-source-of-truth ownership matrix, and unidirectional dependency rules in `docs/MODULE_BOUNDARIES.md`.
- **Cross-Module Communication**: Established public module API barrels (`index.ts`) and asynchronous domain event bus (`src/shared/events/event-bus.ts`).
- **Import Boundary Enforcement**: Implemented automated static analyzer `scripts/check-boundaries.ts` (`bun run check:boundaries`) blocking uncontrolled cross-module imports.
- **Shared Kernel & Utility Boundaries**: Defined domain-agnostic responsibilities in `src/shared/` and pure common utility rules.
- **API Documentation**: Integrated interactive Swagger UI (`/docs`, `/swagger`) and OpenAPI 3.1 JSON specification (`/docs/openapi.json`).
- **Domain Implementation**: Built Patients domain module (`src/modules/patients/`) with full test coverage.

### [v1.0.1](changelogs/v1.0.1.md) — 2026-08-27
- **Project Setup**: Initialized Bun runtime and TypeScript configuration with `@/*` path aliases.
- **Web Framework**: Configured Hono with CORS, Logger, Secure Headers, Pretty JSON, and global error handlers.
- **Database & ORM**: Configured PostgreSQL with Prisma ORM, hot-reload safe singleton, and base data models (`User`, `Role`, `AuditLog`).
- **Environment Management**: Created structured `.env` configuration with Zod runtime validation (`src/config/env.ts`).
- **Development & Build Environments**: Configured hot-reloading dev server and production bundling to `./dist`.
- **Automation Scripts**: Added master runners (`run.sh`, `run.bat`) and standalone scripts (`scripts/dev.*`, `scripts/build.*`, `scripts/start.*`, `scripts/test.*`, `scripts/db.*`).
- **Database Seeding**: Created idempotent seed script (`prisma/seed.ts`) for all Healthcare ERP roles.
- **Architecture & Conventions**: Established 4-tier Modular-Monolith architecture (`docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md`).
- **Reference Implementation**: Implemented Users domain module (`src/modules/users/`) with complete unit and integration test coverage.
