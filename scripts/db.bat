@echo off
cd /d "%~dp0\.."

if "%~1"=="seed" (
    call bun run db:seed
    exit /b 0
)
if "%~1"=="studio" (
    call bun run db:studio
    exit /b 0
)
if "%~1"=="migrate" (
    call bun run db:migrate
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
echo   1) Seed      (Seed initial data)
echo   2) Studio    (Web UI)
echo   3) Migrate   (Apply migrations)
echo   4) Push      (Sync schema)
echo   5) Generate  (Regenerate client)
echo   6) Validate  (Check schema)
echo.
set /p db_choice="Select option [1-6]: "

if "%db_choice%"=="1" call bun run db:seed
if "%db_choice%"=="2" call bun run db:studio
if "%db_choice%"=="3" call bun run db:migrate
if "%db_choice%"=="4" call bun run db:push
if "%db_choice%"=="5" call bun run db:generate
if "%db_choice%"=="6" call bun run db:validate
exit /b 0
