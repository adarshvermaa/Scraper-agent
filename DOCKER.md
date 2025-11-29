# 🐳 Docker Setup for Secure Scrape Agent

This directory contains Docker configurations for running both the **backend** and **frontend** services together in development and production environments.

## 📋 Overview

The Docker setup supports two workflows:
- **Development**: Hot reload enabled, mounted source code, and verbose logging
- **Production**: Optimized builds, nginx for frontend, security hardening

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │      │
│  │  (React/Vite)│──┤  (NestJS)    │──┤              │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                           │                                  │
│                    ┌──────┴────────┐                        │
│                    │               │                         │
│              ┌─────▼────┐    ┌────▼─────┐                  │
│              │  Redis   │    │  Milvus  │                  │
│              │          │    │  (+ etcd │                  │
│              │          │    │  + MinIO)│                  │
│              └──────────┘    └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 4GB of available RAM
- At least 10GB of free disk space

### Initial Setup

1. **Copy environment file**:
   ```bash
   # From the root directory
   cp .env.example .env
   ```

2. **Edit `.env` file** and add your API keys:
   ```env
   OPENAI_API_KEY=your-actual-key
   ANTHROPIC_API_KEY=your-actual-key
   GEMINI_API_KEY=your-actual-key
   ```

### Development Mode

**Start all services** (frontend + backend + dependencies) with hot reload:

```bash
# From the root directory
docker-compose -f docker-compose.dev.yml up --build
```

Or run in detached mode (background):

```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

**Access the services**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3004
- MCP Server: http://localhost:4000
- Prometheus: http://localhost:9090
- MinIO Console: http://localhost:9001

**View logs**:
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

**Stop all services**:
```bash
docker-compose -f docker-compose.dev.yml down
```

**Stop and remove volumes** (⚠️ deletes all data):
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Production Mode

**Start all services** in production mode:

```bash
# From the root directory
docker-compose -f docker-compose.prod.yml up --build -d
```

**Access the services**:
- Frontend: http://localhost
- Backend API: http://localhost:3004
- Other services are not exposed publicly

**View logs**:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

**Stop all services**:
```bash
docker-compose -f docker-compose.prod.yml down
```

## 📂 Project Structure

```
job-scraper/
├── docker-compose.dev.yml          # Dev orchestration (both services)
├── docker-compose.prod.yml         # Prod orchestration (both services)
├── .env.example                    # Environment template
├── .env                           # Your actual env (git-ignored)
├── DOCKER.md                      # This file
│
├── secure-scrape-agent-backend/
│   ├── Dockerfile                 # Multi-stage backend image
│   ├── docker-compose.dev.yml     # Backend-only dev
│   ├── docker-compose.prod.yml    # Backend-only prod
│   └── .env.example
│
└── secure-scrape-agent-frontend/
    ├── Dockerfile                 # Multi-stage frontend image
    ├── docker-compose.dev.yml     # Frontend-only dev
    ├── docker-compose.prod.yml    # Frontend-only prod
    └── .env.example
```

## 🔧 Individual Service Setup

### Backend Only

If you want to run only the backend with its dependencies:

```bash
cd secure-scrape-agent-backend

# Development
npm run docker:dev

# Production
npm run docker:prod
```

Available backend scripts (in `package.json`):
- `npm run docker:dev` - Start dev mode (attached)
- `npm run docker:dev:detached` - Start dev mode (background)
- `npm run docker:prod` - Start production mode
- `npm run docker:prod:logs` - View production logs
- `npm run docker:down:dev` - Stop dev containers
- `npm run docker:down:prod` - Stop prod containers
- `npm run docker:clean` - Remove all containers and volumes

### Frontend Only

If you want to run only the frontend:

```bash
cd secure-scrape-agent-frontend

# Development
npm run docker:dev

# Production
npm run docker:prod
```

Available frontend scripts (in `package.json`):
- `npm run docker:dev` - Start dev mode (attached)
- `npm run docker:dev:detached` - Start dev mode (background)
- `npm run docker:prod` - Start production mode
- `npm run docker:prod:logs` - View production logs
- `npm run docker:down:dev` - Stop dev containers
- `npm run docker:down:prod` - Stop prod containers
- `npm run docker:clean` - Remove all containers and volumes

## 🐛 Troubleshooting

### Issue: Port already in use

**Solution**: Check which service is using the port and stop it:

```bash
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3004

# Then kill the process by PID
taskkill /PID <PID> /F
```

### Issue: Containers not starting properly

**Solution**: Check logs for the specific service:

```bash
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend
```

### Issue: Database connection errors

**Solution**: Ensure PostgreSQL is ready before backend starts. The compose file includes health checks, but you can manually verify:

```bash
docker exec -it scrape-agent-postgres-dev pg_isready -U postgres
```

### Issue: Hot reload not working in dev mode

**Solution**: 
1. Ensure volumes are properly mounted (check `docker-compose.dev.yml`)
2. On Windows, make sure file sharing is enabled in Docker Desktop settings
3. Try rebuilding: `docker-compose -f docker-compose.dev.yml up --build --force-recreate`

### Issue: Out of memory errors

**Solution**: Increase Docker Desktop memory allocation:
1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory to at least 4GB
4. Apply & Restart

### Issue: Milvus fails to start

**Solution**: Milvus requires etcd and MinIO. Check if they're healthy:

```bash
docker-compose -f docker-compose.dev.yml ps
```

All services should show "Up" and "healthy" status.

## 🔒 Security Notes (Production)

1. **Change default passwords** in `.env`:
   - `POSTGRES_PASSWORD`
   - `REDIS_PASSWORD`
   - `MINIO_ROOT_PASSWORD`
   - `JWT_SECRET`

2. **Update CORS_ORIGIN** to your actual domain:
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Use secrets management** for production:
   - Consider using Docker secrets
   - Or use environment-specific `.env` files with restricted permissions

4. **Enable HTTPS**:
   - Add a reverse proxy (nginx/Traefik) with SSL certificates
   - Update frontend build args with HTTPS URLs

## 📊 Resource Usage

Typical resource consumption (development):
- **Backend**: ~500MB RAM, 1 CPU
- **Frontend Dev Server**: ~300MB RAM, 0.5 CPU
- **PostgreSQL**: ~100MB RAM, 0.2 CPU
- **Redis**: ~50MB RAM, 0.1 CPU
- **Milvus + etcd + MinIO**: ~1GB RAM, 1 CPU

**Total**: ~2GB RAM, ~3 CPUs

## 🧪 Health Checks

All services include health checks. View status:

```bash
docker-compose -f docker-compose.dev.yml ps
```

You should see "Up (healthy)" for all services.

## 📝 Environment Variables Reference

### Backend Variables

See `secure-scrape-agent-backend/.env.example` for complete list.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `MILVUS_ADDRESS` - Milvus vector DB endpoint
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` - AI provider keys

### Frontend Variables

See `secure-scrape-agent-frontend/.env.example` for complete list.

Key variables:
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL

## 🔄 Update Workflow

When you make code changes:

### Development Mode
Changes are automatically detected and hot-reloaded thanks to volume mounts. No rebuild needed!

### Production Mode
You need to rebuild the images:

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 📦 Building Images Separately

Build specific service images:

```bash
# Backend
cd secure-scrape-agent-backend
docker build -t scrape-agent-backend:latest .

# Frontend
cd secure-scrape-agent-frontend
docker build -t scrape-agent-frontend:latest .
```

## 🌐 Deploying to Production

For cloud deployment (AWS, GCP, Azure, etc.):

1. **Build and tag images**:
   ```bash
   docker build -t your-registry/scrape-agent-backend:v1.0.0 ./secure-scrape-agent-backend
   docker build -t your-registry/scrape-agent-frontend:v1.0.0 ./secure-scrape-agent-frontend
   ```

2. **Push to registry**:
   ```bash
   docker push your-registry/scrape-agent-backend:v1.0.0
   docker push your-registry/scrape-agent-frontend:v1.0.0
   ```

3. **Update compose file** to use registry images

4. **Deploy** using your cloud provider's container orchestration (ECS, Kubernetes, etc.)

## 💡 Tips

- Use `docker-compose up` without `--build` for faster startups after initial build
- Use `docker system prune` periodically to clean up unused images and containers
- Monitor logs in production with `docker-compose logs -f --tail=100`
- Consider using Docker volumes for persistent data in production

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/deployment)
- [Vite Docker Guide](https://vitejs.dev/guide/build.html)

## 🆘 Getting Help

If you encounter issues:
1. Check logs: `docker-compose logs <service-name>`
2. Verify environment variables in `.env`
3. Ensure all required ports are available
4. Check Docker Desktop is running and updated
5. Review this documentation's troubleshooting section

---

**Happy Dockerizing! 🐳**
