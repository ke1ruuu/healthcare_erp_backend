@echo off
cd /d "%~dp0\.."

if not exist ".env" if exist ".env.example" (
    echo Creating .env from .env.example...
    copy .env.example .env >nul
)

if not exist "node_modules" (
    echo Installing dependencies...
    call bun install
)

echo Starting Healthcare ERP Backend dev server...
call bun run dev
