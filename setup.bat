@echo off
title Raku-Body Setup

echo ===================================================
echo   Raku-Body Environment Setup
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python not found. Please install Python.
        echo.
        pause
        exit /b 1
    ) else (
        set PY_CMD=py
    )
) else (
    set PY_CMD=python
)
echo Python found: %PY_CMD%
echo.

echo [2/4] Checking Node.js (npm)...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js or npm not found. Please install Node.js.
    echo.
    pause
    exit /b 1
)
echo npm found.
echo.

echo [3/4] Setting up Backend (FastAPI)...
cd /d "%~dp0backend"
%PY_CMD% -m venv .venv
if exist ".venv\Scripts\pip.exe" (
    .venv\Scripts\pip.exe install -r requirements.txt
) else (
    %PY_CMD% -m pip install -r requirements.txt
)
echo Backend setup completed.
echo.

echo [4/4] Setting up Frontend (React / Vite)...
cd /d "%~dp0frontend"
call npm install
echo Frontend setup completed.
echo.

echo ===================================================
echo   Setup successfully completed!
echo   Please run start.bat now.
echo ===================================================
echo.
pause
