#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "dist/index.js" ]; then
  echo "Build not found. Building first..."
  bun run build
fi

echo "Starting Healthcare ERP Backend production server..."
exec bun run start
