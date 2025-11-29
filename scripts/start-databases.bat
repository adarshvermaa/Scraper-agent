@echo off
REM ============================================
REM Start Database Services Only (Docker)
REM ============================================

cd /d "%~dp0.."

echo.
echo [DATABASE] Starting database services...
echo.

REM Stop any existing services first
echo [CLEANUP] Stopping existing services...
docker-compose -f docker-compose.dev.yml down 2>nul

REM Kill any process on Redis port
echo [CLEANUP] Freeing port 6379...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :6379') do taskkill /F /PID %%a 2>nul

echo.
echo [DATABASE] Starting PostgreSQL, Redis, Milvus...
docker-compose -f docker-compose.dev.yml up -d postgres redis milvus etcd minio

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Database services started!
    echo.
    echo [INFO] Services available at:
    echo   PostgreSQL: localhost:5432
    echo   Redis:      localhost:6379
    echo   Milvus:     localhost:19530
    echo   MinIO:      localhost:9001
    echo.
) else (
    echo.
    echo [ERROR] Failed to start database services!
    echo [ERROR] Check Docker Desktop is running
    echo.
)

timeout /t 3
