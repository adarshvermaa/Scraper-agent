@echo off
REM ============================================
REM Complete Development Setup
REM Starts: Databases + Frontend + Backend
REM ============================================

cd /d "%~dp0"

echo.
echo ============================================
echo  Complete Development Setup
echo ============================================
echo.

REM Step 1: Stop everything
echo [STEP 1/3] Cleaning up old services...
call "%~dp0stop-all.bat" >nul 2>&1
timeout /t 2 >nul

REM Step 2: Start databases
echo.
echo [STEP 2/3] Starting databases...
call "%~dp0start-databases.bat"

REM Wait for databases to be ready
echo.
echo [WAIT] Waiting for databases to initialize (10s)...
timeout /t 10 >nul

REM Step 3: Start apps
echo.
echo [STEP 3/3] Starting applications...
call "%~dp0start-apps.bat"

echo.
echo ============================================
echo  Setup Complete!
echo ============================================
echo.
echo [SUCCESS] All services running!
echo.
echo [INFO] Access:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3004
echo.
timeout /t 5
