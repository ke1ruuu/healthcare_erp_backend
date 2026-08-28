@echo off
setlocal enabledelayedexpansion

:: ==============================================================================
:: Healthcare ERP Backend - Automated Sequential Launch Script (Windows)
:: Executes all necessary setup, database migration, checks, and services in order.
:: ==============================================================================

cd /d "%~dp0"

echo ======================================================================
echo           Healthcare ERP Backend -- Automated Launch Sequence
echo ======================================================================
echo.

:: 1. Verify Bun runtime
echo [1/6] Checking Bun runtime...
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Bun is not installed or not in PATH.
    echo Please install Bun from https://bun.sh
    exit /b 1
)
echo [OK] Bun is available.
echo.

:: 2. Check and initialize .env
echo [2/6] Checking environment configuration (.env)...
if not exist ".env" (
    if exist ".env.example" (
        echo Notice: .env not found. Creating from .env.example...
        copy .env.example .env >nul
        echo [OK] Created .env successfully.
    ) else (
        echo [ERROR] Neither .env nor .env.example found.
        exit /b 1
    )
) else (
    echo [OK] .env configuration file exists.
)
echo.

:: 3. Check and install dependencies
echo [3/6] Checking project dependencies...
if not exist "node_modules" (
    echo Installing backend dependencies...
    call bun install
) else (
    echo [OK] Backend dependencies installed.
)

if exist "dashboard" (
    if not exist "dashboard\node_modules" (
        echo Installing dashboard dependencies...
        cd dashboard
        call bun install
        cd ..
    ) else (
        echo [OK] Dashboard dependencies installed.
    )
)
echo.

:: 4. Database verification, migration deployment, and seeding
echo [4/6] Initializing PostgreSQL database, migrations and seed data...
call bun run db:setup
if %errorlevel% neq 0 (
    echo [ERROR] Database setup failed.
    exit /b 1
)
echo.

:: 5. Architecture & API contract governance checks
echo [5/6] Running architectural boundary and API drift checks...
call bun run check:boundaries
if %errorlevel% neq 0 (
    echo [ERROR] Boundary check failed.
    exit /b 1
)
call bun run check:api-drift
if %errorlevel% neq 0 (
    echo [ERROR] API drift check failed.
    exit /b 1
)
echo.

:: 6. Process conflict detection & Launch Services
echo [6/6] Checking active ports and launching services...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Detected active process on port 3000. Terminating PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Detected active process on port 5173. Terminating PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo ----------------------------------------------------------------------
echo Services available at:
echo   Backend API:                 http://localhost:3000
echo   API Root Discovery:          http://localhost:3000/
echo   Interactive Swagger UI:      http://localhost:3000/docs
echo   Embedded Telemetry:          http://localhost:3000/dashboard
echo   React Monitoring Dashboard:  http://localhost:5173
echo ----------------------------------------------------------------------
echo Press Ctrl+C to stop all services.
echo.

if exist "dashboard" (
    start "Healthcare ERP Dashboard" cmd /c "cd dashboard && bun run dev"
)

call bun run dev
