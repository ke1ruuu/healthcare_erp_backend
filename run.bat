@echo off
setlocal EnableDelayedExpansion

:: ==============================================================================
:: Healthcare ERP Backend - Master Runner Script (Windows)
:: ==============================================================================

cd /d "%~dp0"

:: Check Bun installation
where bun >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Bun is not installed or not found in PATH.
    echo Please install Bun from: https://bun.sh
    pause
    exit /b 1
)

:: Ensure .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] .env not found. Creating from .env.example...
        copy .env.example .env >nul
        echo [INFO] Created .env successfully.
    ) else (
        echo [ERROR] Neither .env nor .env.example found.
        pause
        exit /b 1
    )
)

:: Ensure node_modules exists
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call bun install
)

:: Check CLI arguments
if "%~1"=="" goto menu
if /i "%~1"=="dev" goto dev
if /i "%~1"=="build" goto build
if /i "%~1"=="start" goto start
if /i "%~1"=="test" goto test
if /i "%~1"=="typecheck" goto typecheck
if /i "%~1"=="clean" goto clean
if /i "%~1"=="db:seed" goto db_seed
if /i "%~1"=="db:studio" goto db_studio
if /i "%~1"=="db:migrate" goto db_migrate
if /i "%~1"=="db:push" goto db_push
if /i "%~1"=="db:generate" goto db_generate
if /i "%~1"=="db:validate" goto db_validate

echo [ERROR] Unknown command: %~1
echo Usage: run.bat [dev^|build^|start^|test^|typecheck^|clean^|db:seed^|db:studio^|db:migrate^|db:push^|db:generate]
exit /b 1

:menu
cls
echo ==================================================
echo          Healthcare ERP Backend Runner
echo ==================================================
echo.
echo Select an action:
echo   1) Start Development Server    (bun run dev)
echo   2) Build Production Bundle     (bun run build)
echo   3) Start Production Server     (bun run start)
echo   4) Run Automated Tests         (bun test)
echo   5) Type Check (TypeScript)     (bun run typecheck)
echo   6) Database Menu (Prisma)
echo   7) Clean Build Cache           (bun run clean)
echo   0) Exit
echo.
set /p choice="Enter choice [0-7]: "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto build
if "%choice%"=="3" goto start
if "%choice%"=="4" goto test
if "%choice%"=="5" goto typecheck
if "%choice%"=="6" goto db_menu
if "%choice%"=="7" goto clean
if "%choice%"=="0" exit /b 0

echo Invalid choice.
pause
goto menu

:db_menu
cls
echo ==================================================
echo         Prisma Database Management
echo ==================================================
echo.
echo   1) Seed Database (bun run db:seed)
echo   2) Open Prisma Studio (Web GUI)
echo   3) Run Migrations (bun run db:migrate)
echo   4) Push Schema (bun run db:push)
echo   5) Generate Prisma Client (bun run db:generate)
echo   6) Validate Schema (bun run db:validate)
echo   0) Back to Main Menu
echo.
set /p db_choice="Enter choice [0-6]: "

if "%db_choice%"=="1" goto db_seed
if "%db_choice%"=="2" goto db_studio
if "%db_choice%"=="3" goto db_migrate
if "%db_choice%"=="4" goto db_push
if "%db_choice%"=="5" goto db_generate
if "%db_choice%"=="6" goto db_validate
if "%db_choice%"=="0" goto menu

echo Invalid choice.
pause
goto db_menu

:dev
echo [INFO] Starting development server with hot reload...
call bun run dev
goto end

:build
echo [INFO] Building production bundle...
call bun run build
goto end

:start
if not exist "dist\index.js" (
    echo [INFO] Build bundle not found. Building first...
    call bun run build
)
echo [INFO] Starting production server...
call bun run start
goto end

:test
echo [INFO] Running test suite...
call bun test
goto end

:typecheck
echo [INFO] Running TypeScript type check...
call bun run typecheck
goto end

:clean
echo [INFO] Cleaning build cache...
call bun run clean
goto end

:db_seed
call bun run db:seed
goto end

:db_studio
call bun run db:studio
goto end

:db_migrate
call bun run db:migrate
goto end

:db_push
call bun run db:push
goto end

:db_generate
call bun run db:generate
goto end

:db_validate
call bun run db:validate
goto end

:end
exit /b 0
