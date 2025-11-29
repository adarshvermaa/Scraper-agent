# 🚀 Secure Scrape Agent - Quick Start with Docker

This guide will help you get the entire **Secure Scrape Agent** system (frontend + backend + all dependencies) up and running with a single command using Docker.

## 📋 What's Included

This Docker setup includes:
- ✅ **Frontend** (React + Vite + TypeScript)
- ✅ **Backend** (NestJS + TypeScript)
- ✅ **PostgreSQL** (Database)
- ✅ **Redis** (Caching & Queues)
- ✅ **Milvus** (Vector Database)
- ✅ **etcd** (Milvus dependency)
- ✅ **MinIO** (Object storage for Milvus)

## ⚡ Quick Start (Development)

### 1. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- 4GB+ RAM available
- 10GB+ disk space

### 2. Clone and Setup

```bash
# Navigate to the project directory
cd d:\job-scraper

# Copy environment template
copy .env.example .env
```

### 3. Configure Environment

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-your-anthropic-key
GEMINI_API_KEY=your-gemini-key
```

### 4. Start Everything!

**Option 1: Using Scripts (Recommended)**

**Windows (PowerShell):**
```powershell
.\docker-start.ps1
```

**Linux/Mac (Bash):**
```bash
# Make script executable (first time only)
chmod +x docker-start.sh

# Start
./docker-start.sh
```

**Simple start scripts:**
```bash
# Development (works on all platforms)
./start-dev.sh      # Linux/Mac
.\start-dev.ps1     # Windows (if created)

# Or use the main script
./docker-start.sh dev
```

**Option 2: Using Docker Compose Directly**

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### 5. Access Your Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3004
- **MinIO Console**: http://localhost:9001 (credentials: minioadmin/minioadmin)

That's it! 🎉 The entire system is now running with hot reload enabled.

## 🏭 Production Deployment

### Start in Production Mode

**Windows (PowerShell):**
```powershell
.\docker-start.ps1 -Mode prod
```

**Linux/Mac (Bash):**
```bash
./docker-start.sh prod
# Or use the simple script
./start-prod.sh
```

**Using Docker Compose:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Access Production Services

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3004

## 🛠️ Useful Commands

### PowerShell Script Commands (Windows)

```powershell
# Start development mode
.\docker-start.ps1

# Start development mode in background
.\docker-start.ps1 -Detached

# Start production mode
.\docker-start.ps1 -Mode prod

# View logs
.\docker-start.ps1 -Mode logs

# Stop all services
.\docker-start.ps1 -Mode stop

# Clean up (removes volumes and data)
.\docker-start.ps1 -Mode clean
```

### Shell Script Commands (Linux/Mac)

```bash
# Start development mode
./docker-start.sh dev

# Start development mode in background
./docker-start.sh dev -d

# Start production mode
./docker-start.sh prod

# View logs
./docker-start.sh logs

# Stop all services
./docker-start.sh stop
# Or use: ./stop-all.sh

# Clean up (removes volumes and data)
./docker-start.sh clean

# Quick start scripts
./start-dev.sh      # Start development (attached)
./start-prod.sh     # Start production (detached)
```

### Docker Compose Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build        # Start (attached)
docker-compose -f docker-compose.dev.yml up --build -d     # Start (detached)
docker-compose -f docker-compose.dev.yml down              # Stop
docker-compose -f docker-compose.dev.yml logs -f           # View logs

# Production
docker-compose -f docker-compose.prod.yml up --build -d    # Start
docker-compose -f docker-compose.prod.yml down             # Stop
docker-compose -f docker-compose.prod.yml logs -f          # View logs

# Cleanup
docker-compose -f docker-compose.dev.yml down -v           # Remove volumes
```

## 📂 Project Structure

```
job-scraper/
├── 🐳 docker-compose.dev.yml       # Development orchestration
├── 🐳 docker-compose.prod.yml      # Production orchestration
├── 📄 .env.example                 # Environment template
├── 📄 DOCKER.md                    # Detailed Docker docs
├── 🔧 docker-start.ps1             # PowerShell helper script (Windows)
├── 🔧 docker-start.sh              # Bash helper script (Linux/Mac)
├── 🚀 start-dev.sh                 # Quick dev start (Linux/Mac)
├── 🚀 start-prod.sh                # Quick prod start (Linux/Mac)
├── 🛑 stop-all.sh                  # Stop all services (Linux/Mac)
│
├── secure-scrape-agent-backend/
│   ├── Dockerfile                  # Multi-stage backend image
│   ├── docker-compose.dev.yml      # Backend-only dev
│   ├── docker-compose.prod.yml     # Backend-only prod
│   └── src/                        # Backend source code
│
└── secure-scrape-agent-frontend/
    ├── Dockerfile                  # Multi-stage frontend image
    ├── docker-compose.dev.yml      # Frontend-only dev
    ├── docker-compose.prod.yml     # Frontend-only prod
    └── src/                        # Frontend source code
```

## 🔍 Service URLs (Development)

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React application |
| Backend | http://localhost:3004 | REST API |
| MCP Server | http://localhost:4000 | Model Context Protocol |
| Prometheus | http://localhost:9090 | Metrics |
| MinIO Console | http://localhost:9001 | Object storage UI |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache/Queue |
| Milvus | localhost:19530 | Vector DB |

## 🐛 Troubleshooting

### Port Conflicts

If you get a port conflict error:

```powershell
# Check what's using the port
netstat -ano | findstr :5173

# Kill the process
taskkill /PID <PID> /F
```

### Docker Not Running

Ensure Docker Desktop is running:
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in system tray should be steady)
3. Try again

### Hot Reload Not Working

On Windows, make sure file sharing is enabled in Docker Desktop:
1. Docker Desktop → Settings → Resources → File Sharing
2. Add `D:\` (or your drive)
3. Apply & Restart

### Out of Memory

Increase Docker memory:
1. Docker Desktop → Settings → Resources
2. Set Memory to at least 4GB
3. Apply & Restart

### Services Not Starting

Check logs for specific service:

```bash
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend
```

## 📖 Detailed Documentation

For comprehensive Docker documentation, see:
- [DOCKER.md](./DOCKER.md) - Complete Docker guide with all options
- [Backend README](./secure-scrape-agent-backend/README.md) - Backend specifics
- [Frontend README](./secure-scrape-agent-frontend/README.md) - Frontend specifics

## 🔐 Security Notes

Before deploying to production:

1. ✅ Change all default passwords in `.env`
2. ✅ Update `CORS_ORIGIN` to your domain
3. ✅ Use strong `JWT_SECRET`
4. ✅ Enable HTTPS with reverse proxy
5. ✅ Restrict database/redis access

## 💡 Tips

- **Development**: Changes to source code are automatically detected and hot-reloaded
- **Production**: Rebuild images after code changes: `docker-compose -f docker-compose.prod.yml up --build -d`
- **Logs**: Always check logs if something isn't working
- **Cleanup**: Use `docker system prune` periodically to free up space

## 🤝 Development Workflow

### Making Changes

1. Edit code in `src/` directories
2. Changes are automatically detected
3. Services reload automatically
4. No need to restart containers!

### Adding Dependencies

If you add npm packages:

```bash
# Rebuild the specific service
docker-compose -f docker-compose.dev.yml up --build frontend
# or
docker-compose -f docker-compose.dev.yml up --build backend
```

### Database Migrations

```bash
# Run migrations in backend container
docker exec -it scrape-agent-backend-dev npm run prisma:migrate
```

## 🚀 Next Steps

Once running:
1. ✅ Open http://localhost:5173 to see the frontend
2. ✅ Test the API at http://localhost:3004/api
3. ✅ Check out the backend docs
4. ✅ Start building!

## 📞 Support

Need help?
- Check [DOCKER.md](./DOCKER.md) for detailed troubleshooting
- Review logs: `.\docker-start.ps1 -Mode logs`
- Ensure all environment variables are set in `.env`

---

**Ready to scrape? Let's go! 🚀**
