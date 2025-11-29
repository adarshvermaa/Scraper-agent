@echo off
echo.
echo [RESET] Resetting Database Volume...
echo.

REM Stop everything
call "%~dp0stop-all.bat" >nul 2>&1

REM Remove the specific volume
echo [CLEANUP] Removing Postgres volume...
docker volume rm job-scraper_postgres-data 2>nul
docker volume rm job-scraper_redis-data 2>nul
docker volume rm job-scraper_milvus-data 2>nul

echo.
echo [SUCCESS] Volumes removed!
echo.
echo [INFO] Restarting everything (this will recreate DBs with correct password)...
echo.

call "%~dp0start-all.bat"
