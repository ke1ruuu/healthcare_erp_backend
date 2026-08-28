@echo off
cd /d "%~dp0\.."

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating existing process on port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

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
