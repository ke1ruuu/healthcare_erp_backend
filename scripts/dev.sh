#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  bun install
fi

echo "Starting Healthcare ERP Backend dev server..."
exec bun run dev
