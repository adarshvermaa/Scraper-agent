@echo off
REM ============================================
REM Kill All Running Services
REM ============================================

echo.
echo [CLEANUP] Stopping all services...
echo.

REM Kill Node processes
echo [CLEANUP] Killing Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Node processes stopped
) else (
    echo [INFO] No Node processes running
)

REM Stop Docker containers
echo.
echo [CLEANUP] Stopping Docker containers...
cd /d "%~dp0.."
docker-compose -f docker-compose.dev.yml down 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Docker containers stopped
) else (
    echo [INFO] No Docker containers running
)

echo.
echo [SUCCESS] Cleanup complete!
echo.
timeout /t 2
