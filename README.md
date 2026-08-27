# Healthcare ERP Backend

A backend API for a Healthcare Enterprise Resource Planning (ERP) system, built with [Hono](https://hono.dev), [Prisma ORM](https://www.prisma.io), and [Bun](https://bun.sh).

---

## Documentation & Monitoring

- 🖥️ [**React Vite Monitoring Dashboard**](http://localhost:5173) (`dashboard/`) — Real-time telemetry, memory gauges, database latency graphs, domain data explorer, and interactive API workbench.
- 📑 [**Interactive Swagger UI**](http://localhost:3000/docs) (`/docs` or `/swagger`) — Live OpenAPI 3.1 interactive testbed and schema explorer.
- [**Engineering & Naming Conventions**](docs/CONVENTIONS.md) — File/folder naming, code identifiers, response envelopes, DTO validation, and healthcare compliance guidelines.
- [**System Architecture & Data Flow**](docs/ARCHITECTURE.md) — Request lifecycle, middleware pipeline, layer breakdown (Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Prisma), and module templates.
- [**Module Boundaries & Dependency Rules**](docs/MODULE_BOUNDARIES.md) — Domain taxonomy, ownership matrix, unidirectional dependency graph, and inter-module communication rules.
- [**API Versioning Strategy & Route Registration**](docs/API_VERSIONING.md) — API root discovery, URI versioning (`/api/v1`), route aggregation, and deprecation policies.
- [**Changelog & Releases**](CHANGELOG.md) — Version history and release notes ([v1.0.2 Changelog](changelogs/v1.0.2.md) / [v1.0.1 Changelog](changelogs/v1.0.1.md)).

---

## Quick Start (Zero Configuration)

You can run, build, and manage everything using the all-in-one runner script without memorizing commands:

### macOS & Linux

```sh
# Open the interactive runner menu:
./run.sh

# Or run commands directly:
./run.sh dev          # Start development server with hot reload
./run.sh build        # Typecheck & build production bundle
./run.sh start        # Start compiled production server
./run.sh test         # Run automated tests
./run.sh db:seed      # Seed database with initial accounts
./run.sh db:studio    # Open Prisma Studio web GUI
./run.sh db:migrate   # Run database migrations
```

### Windows

```bat
:: Open the interactive runner menu:
run.bat

:: Or run commands directly:
run.bat dev
run.bat build
run.bat start
run.bat test
run.bat db:seed
run.bat db:studio
run.bat db:migrate
```

> **Automated checks**: The runner automatically checks if Bun is installed, generates `.env` from `.env.example` if missing, and installs `node_modules` automatically.

---

## Tech Stack

- **Backend Runtime**: Bun & TypeScript
- **Backend Framework**: Hono
- **Monitoring UI**: React 19, Vite, Lucide React, Glassmorphic CSS System
- **Documentation**: Swagger UI & OpenAPI 3.1 (`@hono/swagger-ui`)
- **Database / ORM**: PostgreSQL & Prisma ORM
- **Validation**: Zod (type-safe environment variables and schemas)
- **Security**: CORS, OWASP Secure Headers

---

## Project Structure

```
healthcare_erp_backend/
├── changelogs/               # Versioned milestone release logs
│   ├── v1.0.1.md             # v1.0.1 Foundation & Architecture release log
│   └── v1.0.2.md             # v1.0.2 Architecture, Boundaries & Docs release log
├── dashboard/                # React + Vite Monitoring Dashboard App
│   ├── src/
│   │   ├── components/       # Navbar, VitalsOverview, DomainExplorer, ApiWorkbench, ArchitectureGuard
│   │   ├── App.tsx           # Dashboard layout & live telemetry state
│   │   └── index.css         # Glassmorphic cyber-medical design system
│   ├── package.json
│   └── vite.config.ts        # Vite dev server with proxy to :3000
├── docs/                     # Engineering conventions & architecture documentation
│   ├── CONVENTIONS.md        # Coding, naming, and compliance standards
│   ├── ARCHITECTURE.md       # Architecture, request lifecycle, & module pattern
│   ├── MODULE_BOUNDARIES.md  # Domain taxonomy, ownerships & dependency rules
│   └── API_VERSIONING.md     # API root, URI versioning & route registration
├── prisma/
│   ├── schema.prisma         # Prisma data models and schema
│   └── seed.ts               # Database seeder (idempotent user accounts)
├── scripts/                  # Standalone automation scripts
│   ├── check-boundaries.ts   # Architectural boundary static analyzer
│   ├── check-api-drift.ts    # API contract breaking change detector
│   ├── dev.sh / dev.bat      # Start dev server
│   ├── build.sh / build.bat  # Production build bundle
│   ├── start.sh / start.bat  # Start production server
│   ├── test.sh / test.bat    # Run tests
│   └── db.sh / db.bat        # Database utilities (seed, migrate, studio)
├── src/
│   ├── config/
│   │   └── env.ts            # Type-safe environment validation (Zod)
│   ├── db/
│   │   └── prisma.ts         # Prisma client singleton instance
│   ├── middlewares/
│   │   └── error.middleware.ts # Global error & 404 handlers
│   ├── modules/              # Domain-driven feature modules
│   │   ├── audit-logs/       # Audit log repository & logging
│   │   ├── patients/         # Master Patient Index (MPI) domain
│   │   └── users/            # Staff & User accounts domain
│   ├── shared/               # Shared kernel across modules
│   │   ├── events/           # In-memory domain Event Bus
│   │   ├── types/            # Shared pagination & context types
│   │   └── utils/            # Standardized response envelopes
│   ├── routes/               # Central route registration & version aggregators
│   │   ├── index.ts          # Central route registrar (registerRoutes)
│   │   ├── root.route.ts     # Root API discovery (GET /)
│   │   ├── health.route.ts   # System & DB health check route (GET /health)
│   │   ├── telemetry.route.ts # System telemetry vitals (/api/v1/telemetry)
│   │   ├── dashboard.route.ts # Embedded Hono dashboard route (/dashboard)
│   │   ├── docs.route.ts     # OpenAPI 3.1 JSON & Swagger UI router (/docs)
│   │   └── v1.route.ts       # v1 API version aggregator router (/api/v1)
│   ├── app.ts                # Application factory (createApp) & middleware pipeline
│   └── index.ts              # Runtime server entrypoint (Bun.serve)
├── tests/
│   ├── app.test.ts           # Root, v1, and 404 routing tests
│   ├── telemetry.test.ts     # Telemetry & dashboard tests
│   └── docs.test.ts          # OpenAPI & Swagger UI tests
├── .env                      # Local environment configuration (git-ignored)
├── .env.example              # Environment variables template
├── CHANGELOG.md              # Master release index
├── run.sh                    # Master runner script (macOS/Linux)
├── run.bat                   # Master runner script (Windows)
├── package.json              # Project scripts & dependencies
└── tsconfig.json             # TypeScript config with @/* path aliases
```

---

## Database Seeding & Default Accounts

To populate the database with initial Healthcare ERP roles and staff accounts:

```sh
bun run db:seed
# or: ./run.sh db:seed
```

### Seeded Credentials

> **Default Password for all accounts**: `Password@123`

| Role             | Email                                     | Name              | Status   |
| ---------------- | ----------------------------------------- | ----------------- | -------- |
| `SUPER_ADMIN`    | `superadmin@healthcare-erp.local`         | System SuperAdmin | `ACTIVE` |
| `ADMIN`          | `admin@healthcare-erp.local`              | Hospital Admin    | `ACTIVE` |
| `DOCTOR`         | `doctor.smith@healthcare-erp.local`       | John Smith        | `ACTIVE` |
| `NURSE`          | `nurse.sarah@healthcare-erp.local`        | Sarah Connor      | `ACTIVE` |
| `PHARMACIST`     | `pharmacist.david@healthcare-erp.local`   | David Kim         | `ACTIVE` |
| `RECEPTIONIST`   | `receptionist.clara@healthcare-erp.local` | Clara Oswald      | `ACTIVE` |
| `LAB_TECHNICIAN` | `labtech.james@healthcare-erp.local`      | James Wilson      | `ACTIVE` |
| `ACCOUNTANT`     | `accountant.emma@healthcare-erp.local`    | Emma Watson       | `ACTIVE` |

---

## Environment Variables

Copy `.env.example` to `.env` and configure your settings (or let `./run.sh` create it automatically):

| Variable         | Description                                            | Default                 |
| ---------------- | ------------------------------------------------------ | ----------------------- |
| `NODE_ENV`       | Environment mode (`development`, `production`, `test`) | `development`           |
| `PORT`           | Server port                                            | `3000`                  |
| `DATABASE_URL`   | PostgreSQL connection string                           | Required                |
| `JWT_SECRET`     | Secret key for JWT authentication                      | Required (min 16 chars) |
| `JWT_EXPIRES_IN` | Token lifespan                                         | `7d`                    |
| `CORS_ORIGIN`    | Allowed CORS origins (comma-separated or `*`)          | `*`                     |
| `LOG_LEVEL`      | Logging level (`debug`, `info`, `warn`, `error`)       | `info`                  |

---

## Bun / NPM Scripts

You can run commands directly with Bun:

```sh
# Backend Server
bun run dev               # Start backend development server with hot-reloading
bun run check:boundaries  # Enforce architectural module boundaries & imports
bun run check:api-drift   # Check OpenAPI contract breaking changes
bun run typecheck         # Run TypeScript type check
bun run clean             # Clean build output
bun run build             # Build production bundle (outputs to ./dist and dashboard/dist)
bun run start             # Run production build artifact

# React Monitoring Dashboard
bun run dev:dashboard     # Launch React + Vite monitoring dashboard at http://localhost:5173
bun run build:dashboard   # Build React monitoring dashboard bundle

# Testing
bun test                  # Run automated tests

# Database
bun run db:seed           # Seed database with sample accounts
bun run db:generate       # Generate Prisma Client
bun run db:migrate        # Create and apply migrations
bun run db:push           # Push schema directly to DB
bun run db:studio         # Launch Prisma Studio web GUI
bun run db:validate       # Validate Prisma schema
```

---

## API Endpoints & Monitoring

### React Vite Monitoring Dashboard
- **Dev Server**: `http://localhost:5173` (`bun run dev:dashboard`)
- **Embedded Dashboard**: `http://localhost:3000/dashboard`

### Interactive Swagger UI
- **URL**: `http://localhost:3000/docs` (or `http://localhost:3000/swagger`)
- **OpenAPI 3.1 Spec**: `http://localhost:3000/docs/openapi.json`

### System & Health
- `GET /` - Root discovery endpoint with API metadata, dashboard, and version links
- `GET /health` - System health and database connection status
- `GET /api/v1/telemetry` - Live system vitals, memory gauges, and entity counters

### API Version 1 (`/api/v1`)
- `GET /api/v1` - v1 discovery and available domain endpoints

#### Users Domain Module (`/api/v1/users`)
- `GET /api/v1/users` - List users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Soft delete user

#### Patients Domain Module (`/api/v1/patients`)
- `GET /api/v1/patients` - List patients (paginated, search by name/MRN)
- `GET /api/v1/patients/mrn/:mrn` - Get patient by Medical Record Number
- `GET /api/v1/patients/:id` - Get patient by ID
- `POST /api/v1/patients` - Register new patient
- `PATCH /api/v1/patients/:id` - Update patient record
- `DELETE /api/v1/patients/:id` - Soft delete patient record
