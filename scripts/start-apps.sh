#!/bin/bash

# ============================================
# Start Frontend and Backend (Local)
# ============================================

cd "$(dirname "$0")/.." || exit

echo ""
echo "[APP] Starting Frontend and Backend..."
echo ""

# Kill existing Node processes
echo "[CLEANUP] Stopping existing services..."
killall node 2>/dev/null || pkill node 2>/dev/null || true

# Start Backend
echo ""
echo "[APP] Starting Backend..."
cd secure-scrape-agent-backend || exit
powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd d:/job-scraper/secure-scrape-agent-backend; npm run start:dev'" &
cd ..
sleep 2

# Start Frontend
echo "[APP] Starting Frontend..."
cd secure-scrape-agent-frontend || exit
powershell.exe -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'cd d:/job-scraper/secure-scrape-agent-frontend; npm run dev'" &
cd ..
sleep 2

echo ""
echo "[SUCCESS] Services started!"
echo ""
echo "[INFO] Access your app:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3004"
echo ""
echo "[INFO] Two windows opened - close them to stop services"
echo ""
