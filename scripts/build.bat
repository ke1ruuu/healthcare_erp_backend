@echo off
cd /d "%~dp0\.."

if not exist "node_modules" (
    echo Installing dependencies...
    call bun install
)

echo Building Healthcare ERP Backend...
call bun run build
