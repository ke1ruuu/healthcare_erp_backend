#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

COMMAND="${1:-menu}"

case "$COMMAND" in
  setup)
    exec bun run db:setup
    ;;
  migrate)
    exec bun run db:migrate
    ;;
  "migrate:deploy"|deploy)
    exec bun run db:migrate:deploy
    ;;
  "migrate:status"|status)
    exec bun run db:migrate:status
    ;;
  "migrate:reset"|reset)
    exec bun run db:migrate:reset
    ;;
  "migrate:create"|create)
    exec bun run db:migrate:create
    ;;
  seed)
    exec bun run db:seed
    ;;
  studio)
    exec bun run db:studio
    ;;
  push)
    exec bun run db:push
    ;;
  generate)
    exec bun run db:generate
    ;;
  validate)
    exec bun run db:validate
    ;;
  menu|*)
    echo "=========================================="
    echo "      Prisma Database Helper Script       "
    echo "=========================================="
    echo "  1) Setup & Migrate Local DB  (bun run db:setup)"
    echo "  2) Create / Apply Migration  (bun run db:migrate)"
    echo "  3) Deploy Migrations (Prod)  (bun run db:migrate:deploy)"
    echo "  4) Check Migration Status    (bun run db:migrate:status)"
    echo "  5) Reset Database & Seed     (bun run db:migrate:reset)"
    echo "  6) Open Prisma Studio (GUI)  (bun run db:studio)"
    echo "  7) Seed Accounts             (bun run db:seed)"
    echo "  8) Generate Prisma Client    (bun run db:generate)"
    echo "  9) Validate Schema           (bun run db:validate)"
    echo ""
    read -p "Select option [1-9]: " choice
    case "$choice" in
      1) exec bun run db:setup ;;
      2) exec bun run db:migrate ;;
      3) exec bun run db:migrate:deploy ;;
      4) exec bun run db:migrate:status ;;
      5) exec bun run db:migrate:reset ;;
      6) exec bun run db:studio ;;
      7) exec bun run db:seed ;;
      8) exec bun run db:generate ;;
      9) exec bun run db:validate ;;
      *) echo "Invalid option"; exit 1 ;;
    esac
    ;;
esac
