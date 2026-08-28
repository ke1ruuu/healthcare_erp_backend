#!/usr/bin/env bash

# ==============================================================================
# Healthcare ERP Backend - Automated Sequential Launch Script (macOS / Linux)
# Executes all necessary setup, database migration, checks, and services in order.
# ==============================================================================

set -e

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Determine project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "          Healthcare ERP Backend — Automated Launch Sequence          "
echo "======================================================================"
echo -e "${NC}"

# Function to detect and terminate active processes on specific ports
kill_port_process() {
  local port=$1
  local service_name=$2
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}Detected existing process running on port ${port} (${service_name}). Terminating PID(s): ${pids}...${NC}"
    for pid in $pids; do
      kill -15 "$pid" 2>/dev/null || true
    done
    sleep 0.5
    # Force kill if still lingering
    local remaining
    remaining=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$remaining" ]; then
      for pid in $remaining; do
        kill -9 "$pid" 2>/dev/null || true
      done
      sleep 0.2
    fi
    echo -e "${GREEN}[OK] Port ${port} (${service_name}) is cleared.${NC}"
  fi
}

# 1. Verify Bun runtime
echo -e "${BOLD}[1/6] Checking Bun runtime...${NC}"
if ! command -v bun &> /dev/null; then
  echo -e "${RED}[ERROR] Bun is not installed or not in PATH.${NC}"
  echo -e "Install Bun via: ${CYAN}curl -fsSL https://bun.sh/install | bash${NC}"
  exit 1
fi
echo -e "${GREEN}[OK] Bun is available: $(bun --version)${NC}\n"

# 2. Check and initialize .env
echo -e "${BOLD}[2/6] Checking environment configuration (.env)...${NC}"
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo -e "${YELLOW}Notice: .env not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}[OK] Created .env successfully.${NC}"
  else
    echo -e "${RED}[ERROR] Neither .env nor .env.example found.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}[OK] .env configuration file exists.${NC}"
fi
echo ""

# 3. Check and install dependencies (Root & Dashboard)
echo -e "${BOLD}[3/6] Checking project dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing root dependencies...${NC}"
  bun install
else
  echo -e "${GREEN}[OK] Backend dependencies installed.${NC}"
fi

if [ -d "dashboard" ] && [ ! -d "dashboard/node_modules" ]; then
  echo -e "${YELLOW}Installing dashboard dependencies...${NC}"
  (cd dashboard && bun install)
else
  echo -e "${GREEN}[OK] Dashboard dependencies installed.${NC}"
fi
echo ""

# 4. Database verification, migration deployment, and seeding
echo -e "${BOLD}[4/6] Initializing PostgreSQL database, migrations & seed data...${NC}"
bun run db:setup
echo ""

# 5. Architecture & API contract governance checks
echo -e "${BOLD}[5/6] Running architectural boundary and API drift checks...${NC}"
bun run check:boundaries
bun run check:api-drift
echo ""

# 6. Process conflict detection & Launch Services
echo -e "${BOLD}[6/6] Checking active ports and launching services...${NC}"
kill_port_process 3000 "Backend API"
kill_port_process 5173 "React Dashboard"

echo -e "${CYAN}----------------------------------------------------------------------${NC}"
echo -e "${GREEN}${BOLD}Services available at:${NC}"
echo -e "  Backend API:                 ${CYAN}http://localhost:3000${NC}"
echo -e "  API Root Discovery:          ${CYAN}http://localhost:3000/${NC}"
echo -e "  Interactive Swagger UI:      ${CYAN}http://localhost:3000/docs${NC}"
echo -e "  Embedded Telemetry:          ${CYAN}http://localhost:3000/dashboard${NC}"
echo -e "  React Monitoring Dashboard:  ${CYAN}http://localhost:5173${NC}"
echo -e "${CYAN}----------------------------------------------------------------------${NC}"
echo -e "Press ${BOLD}Ctrl+C${NC} to stop all services.\n"

# Process management: start dashboard in background if available, and run backend in foreground
DASHBOARD_PID=""

cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  if [ -n "$DASHBOARD_PID" ]; then
    kill "$DASHBOARD_PID" 2>/dev/null || true
  fi
  kill_port_process 3000 "Backend API" >/dev/null 2>&1 || true
  kill_port_process 5173 "React Dashboard" >/dev/null 2>&1 || true
  exit 0
}

trap cleanup INT TERM EXIT

if [ -d "dashboard" ]; then
  (cd dashboard && bun run dev) &
  DASHBOARD_PID=$!
fi

# Run backend development server in foreground
exec bun run dev
