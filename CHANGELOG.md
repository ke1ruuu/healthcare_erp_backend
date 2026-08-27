# Changelog

All notable changes and completed milestones for the **Healthcare ERP Backend** are documented in this file and in the dedicated `changelogs/` directory.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Releases

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
