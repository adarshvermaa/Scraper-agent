#!/bin/bash

# ============================================
# Start Database Services Only (Docker)
# ============================================

cd "$(dirname "$0")/.." || exit

echo ""
echo "[DATABASE] Starting database services..."
echo ""

# Stop any existing services first
echo "[CLEANUP] Stopping existing services..."
docker-compose -f docker-compose.dev.yml down 2>/dev/null

# Kill any process on Redis port
echo "[CLEANUP] Freeing port 6379..."
lsof -ti:6379 | xargs kill -9 2>/dev/null || true

echo ""
echo "[DATABASE] Starting PostgreSQL, Redis, Milvus..."
docker-compose -f docker-compose.dev.yml up -d postgres redis milvus etcd minio

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESS] Database services started!"
    echo ""
    echo "[INFO] Services available at:"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis:      localhost:6379"
    echo "  Milvus:     localhost:19530"
    echo "  MinIO:      localhost:9001"
    echo ""
else
    echo ""
    echo "[ERROR] Failed to start database services!"
    echo "[ERROR] Check Docker Desktop is running"
    echo ""
fi
