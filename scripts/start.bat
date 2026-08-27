@echo off
cd /d "%~dp0\.."

if not exist "dist\index.js" (
    echo Build not found. Building first...
    call bun run build
)

echo Starting Healthcare ERP Backend production server...
call bun run start
