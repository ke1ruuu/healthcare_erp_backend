# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary user of the product:** the engineer building and operating this backend — the developer who runs `./run.sh dev`, seeds the database, adds a domain module, and needs to know the service and its Postgres connection are alive.

**Secondary user of the monitoring surface:** a non-implementing stakeholder (reviewer, instructor, technical lead, prospective client) who is shown the running system and must be able to judge its engineering quality without reading the source. Confirmed in this session as the primary viewer the monitoring dashboard is designed for.

**Domain actors modeled in the data, not users of this repo's UI:** clinical and administrative staff — `SUPER_ADMIN`, `ADMIN`, `DOCTOR`, `NURSE`, `PHARMACIST`, `RECEPTIONIST`, `LAB_TECHNICIAN`, `ACCOUNTANT` — and patients, who exist as records rather than as operators of any interface in this repository.

## Product Purpose

A REST API backend for a healthcare Enterprise Resource Planning system. It owns the data, validation, business rules, and audit trail for hospital staff accounts and patient master records, and exposes them over a versioned HTTP interface for client applications to consume.

Success means: a client application can register and retrieve patients and staff through `/api/v1` without knowing anything about the storage layer; every mutation lands in the audit log; and a new domain module can be added by following the same four-layer template without touching another module's tables.

## Positioning

The differentiating mechanism is enforced architecture, not feature count. This is a **modular monolith** where domain boundaries are checked by tooling rather than asserted in documentation: `bun run check:boundaries` fails the build on a cross-module import violation, and `bun run check:api-drift` fails it on a backward-incompatible change to the published API surface. Both run inside `bun run build`. A neighboring project can copy the endpoints; it cannot truthfully claim the boundaries are mechanically enforced unless it also ships those gates.

## Operating Context

- Local development on macOS/Windows via `./run.sh` / `run.bat`, which bootstraps `.env`, dependencies, and Bun itself.
- The backend serves on port 3000. The monitoring dashboard is a separate Vite app on port 5173 in development, proxying `/api`, `/health`, and `/docs` to port 3000.
- Two documentation surfaces already exist and are load-bearing: Swagger UI at `/docs` (OpenAPI 3.1) and the Markdown set in `docs/` (ARCHITECTURE, MODULE_BOUNDARIES, CONVENTIONS, API_VERSIONING).
- The database is PostgreSQL via Prisma. `bun run db:seed` populates initial staff accounts; `bunx prisma studio` is the fallback data browser.
- The project is at v1.0.2 and pre-authentication: JWT/RBAC middleware is referenced in the architecture documents but the current `/api/v1` routes are not yet gated.

## Capabilities and Constraints

**Confirmed capabilities**

- `GET /` — API root discovery: name, version, environment, uptime, and the location of every other surface.
- `GET /health` — liveness probe.
- `GET /api/v1/telemetry` — the monitoring data source. Returns `system` (name, version, environment, port, uptimeSeconds, timestamp, runtime, platform, arch), `memory` (rssMB, heapUsedMB, heapTotalMB, externalMB, heapUsagePercent), `database` (status, latencyMs, provider), `entities` (activeUsers, activePatients, auditLogsCount), `architecture` (pattern, versioning, boundariesStatus, apiDriftStatus, security), and `telemetryLatencyMs`.
- `GET /api/v1/users`, `GET /api/v1/patients` (with `?search=`), `POST /api/v1/patients` — the domain surface reachable from the dashboard today.
- `/docs`, `/docs/openapi.json`, `/swagger` — interactive API documentation.
- `/dashboard`, `/monitor`, `/status` — the monitoring surface and its aliases.

**Constraints**

- Runtime is Bun; the HTTP framework is Hono; the ORM is Prisma. Validation is Zod DTOs at the route layer.
- Layer order is fixed and tool-enforced: route → controller → service → repository → Prisma. Repositories are module-private; modules expose only service contracts through `index.ts` barrels.
- Deletes are soft (`deletedAt`), and every read filters `deletedAt: null`. Counts shown anywhere must respect this.
- Patient identity is a generated `medicalRecordNumber` (MRN), unique, server-assigned.
- API versioning is URI-path (`/api/v1`); breaking a published shape is a build failure, not a judgment call.
- The dashboard is React 19 + Vite 8 + TypeScript with `lucide-react` as the icon library. No CSS framework, no component library, no charting library is currently installed.
- Telemetry is polled by the client; there is no WebSocket or SSE stream. Poll interval is user-controlled.

**Explicitly undecided**

- Authentication and RBAC enforcement on `/api/v1` routes.
- Whether patient write operations belong in a backend monitoring surface long-term.
- Deployment target and hosting.

## Brand Commitments

The product name is **Healthcare ERP Backend**. There is no logo, wordmark, brand palette, or typeface commitment in the repository — the existing dashboard's appearance is an unratified draft, not an identity, and was explicitly identified by the user as generic AI output to be replaced.

Voice in existing documentation is plain engineering prose: precise, unhyped, comfortable with technical nouns. Data and enums are SCREAMING_SNAKE_CASE in the schema and should be presented as the domain terms they are (`O_POSITIVE`, `SUPER_ADMIN`) rather than prettified into ambiguity.

## Evidence on Hand

- Real, live runtime telemetry from `/api/v1/telemetry` — genuine uptime, memory, and Postgres round-trip latency. This is real evidence and must never be simulated or animated with fake data.
- Real seeded staff and patient records via `bun run db:seed`.
- Real machine-checked governance results: `scripts/check-boundaries.ts` and `scripts/check-api-drift.ts` produce genuine pass/fail output. The current dashboard hardcodes "Enforced (Zero Violations)" and "Clean (100% Backward-Compatible)" as strings inside the telemetry route — these are **claims not currently derived from running the checks**, and future work must not present them as verified results unless they are wired to the actual scripts.
- Real OpenAPI 3.1 specification at `/docs/openapi.json`.
- `dashboard/src/assets/hero.png` is Vite scaffold residue, not a product asset.

**Must not be fabricated:** patient data presented as real people, uptime or latency figures, test coverage numbers, performance benchmarks, user counts, compliance certifications (HIPAA/GDPR conformance is not established), or deployment/production claims. The system has never run in production.

## Product Principles

1. **Boundaries are proven, not promised.** Anything the product claims about its architecture should be traceable to a check that can fail.
2. **The API is the product; every other surface explains it.** Dashboard, Swagger, and docs exist to make the API legible — none of them may become a second source of truth about its behavior.
3. **Real numbers or no numbers.** Telemetry, counts, and check results are shown as measured or shown as absent. Placeholder and decorative data are worse than an empty state.
4. **Soft delete is a domain rule, not an implementation detail.** What is presented as active is what the API considers active.
5. **A new domain module should be boring to add.** Uniform layering and naming beat local cleverness.

## Accessibility & Inclusion

No product-specific standard has been established. General baseline applies: keyboard operability and WCAG AA contrast on any surface built here.
