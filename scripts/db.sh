#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

COMMAND="${1:-menu}"

case "$COMMAND" in
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
    echo "  1) Studio    (Web UI)"
    echo "  2) Migrate   (Apply migrations)"
    echo "  3) Push      (Sync schema)"
    echo "  4) Generate  (Regenerate client)"
    echo "  5) Validate  (Check schema)"
    echo ""
    read -p "Select option [1-5]: " choice
    case "$choice" in
      1) exec bun run db:studio ;;
      2) exec bun run db:migrate ;;
      3) exec bun run db:push ;;
      4) exec bun run db:generate ;;
      5) exec bun run db:validate ;;
      *) echo "Invalid option"; exit 1 ;;
    esac
    ;;
esac
