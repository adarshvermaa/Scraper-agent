#!/bin/bash

# ============================================
# Complete Development Setup
# Starts: Databases + Frontend + Backend
# ============================================

cd "$(dirname "$0")" || exit

echo ""
echo "============================================"
echo " Complete Development Setup"
echo "============================================"
echo ""

# Step 1: Stop everything
echo "[STEP 1/3] Cleaning up old services..."
./stop-all.sh >/dev/null 2>&1
sleep 2

# Step 2: Start databases
echo ""
echo "[STEP 2/3] Starting databases..."
./start-databases.sh

# Wait for databases to be ready
echo ""
echo "[WAIT] Waiting for databases to initialize (10s)..."
sleep 10

# Step 3: Start apps
echo ""
echo "[STEP 3/3] Starting applications..."
./start-apps.sh

echo ""
echo "============================================"
echo " Setup Complete!"
echo "============================================"
echo ""
echo "[SUCCESS] All services running!"
echo ""
echo "[INFO] Access:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3004"
echo ""
