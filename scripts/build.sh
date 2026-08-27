#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  bun install
fi

echo "Building Healthcare ERP Backend..."
exec bun run build
