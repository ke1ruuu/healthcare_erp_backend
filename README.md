# Healthcare ERP Backend

A backend API for a Healthcare Enterprise Resource Planning (ERP) system, built with [Hono](https://hono.dev), [Prisma ORM](https://www.prisma.io), and [Bun](https://bun.sh).

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
run.bat db:studio
run.bat db:migrate
```

> **Automated checks**: The runner automatically checks if Bun is installed, generates `.env` from `.env.example` if missing, and installs `node_modules` automatically.

---

## Tech Stack
- **Runtime**: Bun
- **Framework**: Hono
- **Database / ORM**: PostgreSQL & Prisma ORM
- **Validation**: Zod (type-safe environment variables and schemas)
- **Security**: CORS, OWASP Secure Headers

---

## Project Structure
```
healthcare_erp_backend/
├── prisma/
│   └── schema.prisma         # Prisma data models and schema
├── scripts/                  # Standalone automation scripts
│   ├── dev.sh / dev.bat      # Start dev server
│   ├── build.sh / build.bat  # Production build bundle
│   ├── start.sh / start.bat  # Start production server
│   ├── test.sh / test.bat    # Run tests
│   └── db.sh / db.bat        # Database utilities
├── src/
│   ├── config/
│   │   └── env.ts            # Type-safe environment validation (Zod)
│   ├── db/
│   │   └── prisma.ts         # Prisma client singleton instance
│   ├── middlewares/
│   │   └── error.middleware.ts # Global error & 404 handlers
│   ├── routes/
│   │   └── health.route.ts   # System & DB health check route
│   └── index.ts              # Server entry point and middleware configuration
├── tests/
│   └── app.test.ts           # Automated endpoint tests
├── .env                      # Local environment configuration (git-ignored)
├── .env.example              # Environment variables template
├── run.sh                    # Master runner script (macOS/Linux)
├── run.bat                   # Master runner script (Windows)
├── package.json              # Project scripts & dependencies
└── tsconfig.json             # TypeScript config with @/* path aliases
```

---

## Environment Variables
Copy `.env.example` to `.env` and configure your settings (or let `./run.sh` create it automatically):

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT authentication | Required (min 16 chars) |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `*` |
| `LOG_LEVEL` | Logging level (`debug`, `info`, `warn`, `error`) | `info` |

---

## Bun / NPM Scripts

You can also run commands directly with Bun:

```sh
# Development
bun run dev          # Start development server with hot-reloading
bun run typecheck    # Run TypeScript type check
bun run clean        # Clean build output
bun run build        # Build production bundle (outputs to ./dist)
bun run start        # Run production build artifact

# Testing
bun test             # Run automated tests

# Database
bun run db:generate  # Generate Prisma Client
bun run db:migrate   # Create and apply migrations
bun run db:push      # Push schema directly to DB
bun run db:studio    # Launch Prisma Studio web GUI
bun run db:validate  # Validate Prisma schema
```

---

## API Endpoints

- `GET /` - Root endpoint with API metadata
- `GET /health` - System health and database connection status
