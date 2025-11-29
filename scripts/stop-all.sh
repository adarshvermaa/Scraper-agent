#!/bin/bash

# ============================================
# Kill All Running Services
# ============================================

echo ""
echo "[CLEANUP] Stopping all services..."
echo ""

# Kill Node processes
echo "[CLEANUP] Killing Node.js processes..."
killall node 2>/dev/null || pkill node 2>/dev/null || true
echo "[SUCCESS] Node processes stopped"

# Stop Docker containers
echo ""
echo "[CLEANUP] Stopping Docker containers..."
cd "$(dirname "$0")/.." || exit
docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
echo "[SUCCESS] Docker containers stopped"

echo ""
echo "[SUCCESS] Cleanup complete!"
echo ""
