@echo off
title Raku-Body Start

set "PROJECT_DIR=C:\Users\ipc\.gemini\antigravity\scratch\raku-body"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===================================================
echo   Starting Raku-Body servers...
echo ===================================================
echo.

if not exist "%PROJECT_DIR%" (
    echo [ERROR] Project directory not found: %PROJECT_DIR%
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%"

if exist "%PROJECT_DIR%\backend\.venv\Scripts\uvicorn.exe" (
    start "RakuBody-Backend" /D "%PROJECT_DIR%\backend" cmd /k ""%PROJECT_DIR%\backend\.venv\Scripts\uvicorn.exe" main:app --reload --port 8000"
) else (
    start "RakuBody-Backend" /D "%PROJECT_DIR%\backend" cmd /k "uvicorn main:app --reload --port 8000"
)

start "RakuBody-Frontend" /D "%PROJECT_DIR%\frontend" cmd /k "npm run dev"

echo Waiting for servers to initialize...
timeout /t 5 > nul

start http://localhost:3000
echo.
echo Browser opened at http://localhost:3000
echo To stop servers, close the opened command prompt windows.