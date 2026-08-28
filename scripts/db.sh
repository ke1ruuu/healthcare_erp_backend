#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

COMMAND="${1:-menu}"

case "$COMMAND" in
  setup)
    exec bun run db:setup
    ;;
  seed)
    exec bun run db:seed
    ;;
  studio)
    exec bun run db:studio
    ;;
  migrate)
    exec bun run db:migrate
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
    echo "  1) Setup     (Verify, sync & seed local DB)"
    echo "  2) Seed      (Seed initial accounts)"
    echo "  3) Studio    (Web GUI)"
    echo "  4) Migrate   (Apply migrations)"
    echo "  5) Push      (Sync schema)"
    echo "  6) Generate  (Regenerate client)"
    echo "  7) Validate  (Check schema)"
    echo ""
    read -p "Select option [1-7]: " choice
    case "$choice" in
      1) exec bun run db:setup ;;
      2) exec bun run db:seed ;;
      3) exec bun run db:studio ;;
      4) exec bun run db:migrate ;;
      5) exec bun run db:push ;;
      6) exec bun run db:generate ;;
      7) exec bun run db:validate ;;
      *) echo "Invalid option"; exit 1 ;;
    esac
    ;;
esac
