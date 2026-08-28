@echo off
cd /d "%~dp0\.."

if "%~1"=="setup" (
    call bun run db:setup
    exit /b 0
)
if "%~1"=="migrate" (
    call bun run db:migrate
    exit /b 0
)
if "%~1"=="deploy" (
    call bun run db:migrate:deploy
    exit /b 0
)
if "%~1"=="migrate:deploy" (
    call bun run db:migrate:deploy
    exit /b 0
)
if "%~1"=="status" (
    call bun run db:migrate:status
    exit /b 0
)
if "%~1"=="migrate:status" (
    call bun run db:migrate:status
    exit /b 0
)
if "%~1"=="reset" (
    call bun run db:migrate:reset
    exit /b 0
)
if "%~1"=="migrate:reset" (
    call bun run db:migrate:reset
    exit /b 0
)
if "%~1"=="seed" (
    call bun run db:seed
    exit /b 0
)
if "%~1"=="studio" (
    call bun run db:studio
    exit /b 0
)
if "%~1"=="push" (
    call bun run db:push
    exit /b 0
)
if "%~1"=="generate" (
    call bun run db:generate
    exit /b 0
)
if "%~1"=="validate" (
    call bun run db:validate
    exit /b 0
)

echo ==========================================
echo       Prisma Database Helper Script
echo ==========================================
echo   1) Setup & Migrate Local DB  (bun run db:setup)
echo   2) Create / Apply Migration  (bun run db:migrate)
echo   3) Deploy Migrations (Prod)  (bun run db:migrate:deploy)
echo   4) Check Migration Status    (bun run db:migrate:status)
echo   5) Reset Database & Seed     (bun run db:migrate:reset)
echo   6) Open Prisma Studio (GUI)  (bun run db:studio)
echo   7) Seed Accounts             (bun run db:seed)
echo   8) Generate Prisma Client    (bun run db:generate)
echo   9) Validate Schema           (bun run db:validate)
echo.
set /p db_choice="Select option [1-9]: "

if "%db_choice%"=="1" call bun run db:setup
if "%db_choice%"=="2" call bun run db:migrate
if "%db_choice%"=="3" call bun run db:migrate:deploy
if "%db_choice%"=="4" call bun run db:migrate:status
if "%db_choice%"=="5" call bun run db:migrate:reset
if "%db_choice%"=="6" call bun run db:studio
if "%db_choice%"=="7" call bun run db:seed
if "%db_choice%"=="8" call bun run db:generate
if "%db_choice%"=="9" call bun run db:validate
exit /b 0
