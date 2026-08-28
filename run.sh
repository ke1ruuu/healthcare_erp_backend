#!/usr/bin/env bash

# ==============================================================================
# Healthcare ERP Backend - Master Runner Script (macOS / Linux)
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

# Ensure Bun is installed
check_bun() {
  if ! command -v bun &> /dev/null; then
    echo -e "${RED}Error: Bun is not installed or not found in PATH.${NC}"
    echo -e "Please install Bun by running: ${CYAN}curl -fsSL https://bun.sh/install | bash${NC}"
    exit 1
  fi
}

# Ensure .env exists
check_env() {
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      echo -e "${YELLOW}Notice: .env file not found. Creating from .env.example...${NC}"
      cp .env.example .env
      echo -e "${GREEN}Created .env successfully.${NC}"
    else
      echo -e "${RED}Error: Neither .env nor .env.example found.${NC}"
      exit 1
    fi
  fi
}

# Ensure dependencies are installed
check_deps() {
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Notice: node_modules not found. Installing dependencies...${NC}"
    bun install
  fi
}

# Pre-flight setup
setup() {
  check_bun
  check_env
  check_deps
}

# Display Header Banner
show_banner() {
  echo -e "${CYAN}${BOLD}"
  echo "=================================================="
  echo "         Healthcare ERP Backend Runner            "
  echo "=================================================="
  echo -e "${NC}"
}

# Interactive Menu
show_menu() {
  show_banner
  echo -e "${BOLD}Select an action to perform:${NC}"
  echo "  1) Start Development Server    (bun run dev)"
  echo "  2) Build Production Bundle     (bun run build)"
  echo "  3) Start Production Server     (bun run start)"
  echo "  4) Run Automated Tests         (bun test)"
  echo "  5) Type Check (TypeScript)     (bun run typecheck)"
  echo "  6) Prisma Database Menu        (Setup, Seed, Migrate, Studio, Push)"
  echo "  7) Clean Build Cache           (bun run clean)"
  echo "  0) Exit"
  echo ""
  read -p "Enter choice [0-7]: " choice
  echo ""

  case "$choice" in
    1) run_dev ;;
    2) run_build ;;
    3) run_start ;;
    4) run_test ;;
    5) run_typecheck ;;
    6) show_db_menu ;;
    7) run_clean ;;
    0) echo "Exiting."; exit 0 ;;
    *) echo -e "${RED}Invalid choice.${NC}"; exit 1 ;;
  esac
}

# Database Sub-Menu
show_db_menu() {
  echo -e "${CYAN}${BOLD}--- Prisma Database Management ---${NC}"
  echo "  1) Setup & Migrate Local DB  (bun run db:setup)"
  echo "  2) Create / Apply Migration  (bun run db:migrate)"
  echo "  3) Deploy Migrations (Prod)  (bun run db:migrate:deploy)"
  echo "  4) Check Migration Status    (bun run db:migrate:status)"
  echo "  5) Reset Database & Seed     (bun run db:migrate:reset)"
  echo "  6) Open Prisma Studio (GUI)  (bun run db:studio)"
  echo "  7) Seed Accounts             (bun run db:seed)"
  echo "  8) Generate Prisma Client    (bun run db:generate)"
  echo "  9) Validate Schema           (bun run db:validate)"
  echo "  0) Back to Main Menu"
  echo ""
  read -p "Enter choice [0-9]: " db_choice
  echo ""

  case "$db_choice" in
    1) bun run db:setup ;;
    2) bun run db:migrate ;;
    3) bun run db:migrate:deploy ;;
    4) bun run db:migrate:status ;;
    5) bun run db:migrate:reset ;;
    6) bun run db:studio ;;
    7) bun run db:seed ;;
    8) bun run db:generate ;;
    9) bun run db:validate ;;
    0) show_menu ;;
    *) echo -e "${RED}Invalid choice.${NC}"; exit 1 ;;
  esac
}

# Actions
run_dev() {
  local pids
  pids=$(lsof -ti :3000 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}Terminating existing process on port 3000 (PID: ${pids})...${NC}"
    kill -9 $pids 2>/dev/null || true
    sleep 0.3
  fi
  echo -e "${GREEN}Starting development server with hot reload...${NC}"
  bun run dev
}

run_build() {
  echo -e "${GREEN}Building production bundle...${NC}"
  bun run build
}

run_start() {
  if [ ! -f "dist/index.js" ]; then
    echo -e "${YELLOW}Build bundle not found in ./dist. Running build first...${NC}"
    bun run build
  fi
  echo -e "${GREEN}Starting production server from dist/index.js...${NC}"
  bun run start
}

run_test() {
  echo -e "${GREEN}Running test suite...${NC}"
  bun test
}

run_typecheck() {
  echo -e "${GREEN}Running TypeScript type checker...${NC}"
  bun run typecheck
}

run_clean() {
  echo -e "${GREEN}Cleaning build output...${NC}"
  bun run clean
  echo -e "${GREEN}Done.${NC}"
}

# Main Execution Flow
setup

if [ $# -eq 0 ]; then
  show_menu
else
  case "$1" in
    dev) run_dev ;;
    build) run_build ;;
    start) run_start ;;
    test) run_test ;;
    typecheck) run_typecheck ;;
    clean) run_clean ;;
    db:setup) bun run db:setup ;;
    db:migrate) bun run db:migrate ;;
    db:migrate:deploy) bun run db:migrate:deploy ;;
    db:migrate:status) bun run db:migrate:status ;;
    db:migrate:reset) bun run db:migrate:reset ;;
    db:seed) bun run db:seed ;;
    db:studio) bun run db:studio ;;
    db:push) bun run db:push ;;
    db:generate) bun run db:generate ;;
    db:validate) bun run db:validate ;;
    help|--help|-h)
      echo "Usage: ./run.sh [command]"
      echo ""
      echo "Commands:"
      echo "  (no args)    Open interactive menu"
      echo "  dev          Start development server"
      echo "  build        Typecheck and build production bundle"
      echo "  start        Run production bundle"
      echo "  test         Run tests"
      echo "  typecheck    Run TypeScript checks"
      echo "  clean        Remove ./dist folder"
      echo "  db:setup     Verify, sync, and seed local PostgreSQL DB"
      echo "  db:seed      Seed database with initial accounts"
      echo "  db:studio    Open Prisma Studio"
      echo "  db:migrate   Run Prisma migration"
      echo "  db:push      Push schema directly"
      echo "  db:generate  Regenerate Prisma client"
      ;;
    *)
      echo -e "${RED}Unknown command: $1${NC}"
      echo "Run './run.sh help' for usage instructions."
      exit 1
      ;;
  esac
fi
