#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

COMMAND="${1:-menu}"

case "$COMMAND" in
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
    echo "  1) Seed      (Seed initial data)"
    echo "  2) Studio    (Web UI)"
    echo "  3) Migrate   (Apply migrations)"
    echo "  4) Push      (Sync schema)"
    echo "  5) Generate  (Regenerate client)"
    echo "  6) Validate  (Check schema)"
    echo ""
    read -p "Select option [1-6]: " choice
    case "$choice" in
      1) exec bun run db:seed ;;
      2) exec bun run db:studio ;;
      3) exec bun run db:migrate ;;
      4) exec bun run db:push ;;
      5) exec bun run db:generate ;;
      6) exec bun run db:validate ;;
      *) echo "Invalid option"; exit 1 ;;
    esac
    ;;
esac
