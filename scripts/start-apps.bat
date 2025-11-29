@echo off
REM ============================================
REM Start Frontend and Backend (Local)
REM ============================================

cd /d "%~dp0.."

echo.
echo [APP] Starting Frontend and Backend...
echo.

REM Kill existing Node processes
echo [CLEANUP] Stopping existing services...
taskkill /F /IM node.exe 2>nul

REM Start Backend
echo.
echo [APP] Starting Backend...
start "Backend Server" cmd /k "cd /d %~dp0..\secure-scrape-agent-backend && npm run start:dev"
timeout /t 2 >nul

REM Start Frontend
echo [APP] Starting Frontend...
start "Frontend Server" cmd /k "cd /d %~dp0..\secure-scrape-agent-frontend && npm run dev"
timeout /t 2 >nul

echo.
echo [SUCCESS] Services started!
echo.
echo [INFO] Access your app:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3004
echo.
echo [INFO] Two windows opened - close them to stop services
echo.
timeout /t 3
