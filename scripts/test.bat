@echo off
cd /d "%~dp0\.."

if not exist "node_modules" (
    call bun install
)

echo Running tests...
call bun test %*
