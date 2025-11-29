# 🚀 Local Development Scripts (No Docker)

These scripts start **only the frontend and backend** locally using npm, without Docker containers.

## 📋 Available Scripts

| File | Platform | Description |
|------|----------|-------------|
| `start-local.bat` | Windows | ✅ Batch file (simplest, recommended) |
| `start-local.sh` | Linux/Mac | Shell script |
| `start-local-simple.ps1` | Windows | PowerShell (alternative) |

## ✅ Recommended: Use Batch File (Windows)

### Quick Start

```bash
# Just double-click or run:
.\start-local.bat
```

**What it does:**
- ✅ Opens **2 separate command windows**
- ✅ Window 1: Backend server (port 3004)
- ✅ Window 2: Frontend server (port 5173)
- ✅ Both stay open and show live logs
- ✅ Simple to stop (just close the windows)

### Access Your Services

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3004

### Stop Services

Just **close the command windows** that opened, or press `Ctrl+C` in each window.

---

## 🐧 Linux/Mac: Use Shell Script

### Setup (First time only)

```bash
chmod +x start-local.sh
```

### Run

```bash
./start-local.sh
```

**What it does:**
- ✅ Starts backend and frontend in background
- ✅ Creates log files: `backend.log` and `frontend.log`
- ✅ Shows both service URLs
- ✅ Press `Ctrl+C` to stop both services

### View Logs

```bash
# Watch backend logs
tail -f backend.log

# Watch frontend logs
tail -f frontend.log
```

---

## 🔍 When to Use These Scripts

### Use Local Scripts When:
- ✅ You already have PostgreSQL, Redis, etc. running elsewhere
- ✅ You want faster startup (no Docker overhead)
- ✅ You're only working on frontend/backend code
- ✅ You hit Docker port conflicts

### Use Docker Scripts When:
- ✅ You need the full stack (database, redis, milvus)
- ✅ You want isolated development environment
- ✅ You're testing the complete system
- ✅ You want production-like setup

---

## 📊 Comparison

| Feature | Local Scripts | Docker Scripts |
|---------|--------------|----------------|
| **Startup Speed** | ⚡ Fast (5-10 sec) | 🐢 Slower (1-2 min) |
| **Dependencies** | ❌ Manual setup | ✅ All included |
| **Hot Reload** | ✅ Yes | ✅ Yes |
| **RAM Usage** | 💚 Low (~500MB) | ⚠️ High (~2GB) |
| **Port Conflicts** | May occur | Isolated |
| **Database** | Need separate | ✅ Included |

---

## 🛠️ Prerequisites for Local Scripts

Before using local scripts, ensure you have:

### Required:
- ✅ Node.js 20+ installed
- ✅ npm installed
- ✅ Dependencies installed in each project:
  ```bash
  cd secure-scrape-agent-backend && npm install
  cd secure-scrape-agent-frontend && npm install
  ```

### Optional (for full functionality):
- PostgreSQL running on port 5432
- Redis running on port 6379
- Milvus running on port 19530
- `.env` files configured in each project

---

## 💡 Tips

### Windows Users:
- **Easiest**: Use `start-local.bat` (double-click or run from terminal)
- **Alternative**: Use PowerShell script if batch doesn't work
- **Stop**: Close the windows or Ctrl+C

### Linux/Mac Users:
- **Run**: `./start-local.sh`
- **Logs**: Check `backend.log` and `frontend.log`
- **Stop**: Press Ctrl+C

### All Platforms:
- Services will auto-reload when you edit code
- Frontend changes: instant reload in browser
- Backend changes: server auto-restarts (NestJS watch mode)

---

## 🐛 Troubleshooting

### Port Already in Use

**Problem:**
```
Port 3004 is already in use
```

**Solution:**
```bash
# Windows
netstat -ano | findstr :3004
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3004
kill -9 <PID>
```

### Dependencies Not Installed

**Problem:**
```
Cannot find module 'xyz'
```

**Solution:**
```bash
cd secure-scrape-agent-backend
npm install

cd secure-scrape-agent-frontend
npm install
```

### Database Connection Error

**Problem:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
Either:
1. Start PostgreSQL locally
2. Or use Docker for database only:
   ```bash
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine
   ```

---

## 📚 Related Documentation

- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - For full Docker setup
- [SCRIPTS_REFERENCE.md](./SCRIPTS_REFERENCE.md) - All Docker scripts
- [start-backend.ps1](./start-backend.ps1) - Original backend scripts
- [start-frontend.ps1](./start-frontend.ps1) - Original frontend scripts

---

## 🎯 Summary

**Quick Start (Windows):**
```bash
.\start-local.bat
# Then open http://localhost:5173
```

**Quick Start (Linux/Mac):**
```bash
chmod +x start-local.sh
./start-local.sh
# Then open http://localhost:5173
```

**Stop:**
- Windows: Close the command windows
- Linux/Mac: Press Ctrl+C

**That's it! Happy coding! 🚀**
