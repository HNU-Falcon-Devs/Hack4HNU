@echo off
title HNU CTF - Stop Background Server
echo ========================================================
echo   Stopping HNU CTF Background PHP Server (Port 8000)...
echo ========================================================
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo Terminating server process with PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo [OK] HNU CTF server stopped successfully.
echo.
timeout /t 3

