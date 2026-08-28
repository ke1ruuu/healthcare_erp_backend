#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Detect and kill existing process on port 3000
pids=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "Terminating existing process on port 3000 (PID: $pids)..."
  kill -9 $pids 2>/dev/null || true
  sleep 0.3
fi

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
