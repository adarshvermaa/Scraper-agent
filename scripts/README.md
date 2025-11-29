# 🚀 Scripts Directory

All development scripts organized in one place!

## 📂 Structure

```
scripts/
├── start-all.bat/.sh       # Start everything (databases + apps)
├── start-databases.bat/.sh # Start only databases (Docker)
├── start-apps.bat/.sh      # Start only frontend + backend
└── stop-all.bat/.sh       # Stop everything
```

## 🎯 Quick Start

### **Windows (Command Prompt or PowerShell)**

```cmd
cd scripts
start-all.bat
```

### **Linux/Mac or Git Bash**

```bash
cd scripts
chmod +x *.sh
./start-all.sh
```

---

## 📜 Script Details

### **start-all** - Complete Setup
Runs everything in order:
1. Stops old services
2. Starts databases (Docker)
3. Waits 10s for initialization
4. Starts frontend + backend

**Usage:**
```bash
# Windows
scripts\start-all.bat

# Linux/Mac/Git Bash
scripts/start-all.sh
```

---

### **start-databases** - Databases Only
Starts PostgreSQL, Redis, Milvus via Docker

**What it does:**
- Stops existing Docker containers
- Frees port 6379 (Redis)
- Starts database services

**Usage:**
```bash
# Windows
scripts\start-databases.bat

# Linux/Mac/Git Bash
scripts/start-databases.sh
```

**Services:**
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Milvus: localhost:19530
- MinIO: localhost:9001

---

### **start-apps** - Apps Only
Starts frontend + backend locally (no Docker)

**What it does:**
- Kills existing Node processes
- Opens 2 windows:
  - Backend (port 3004)
  - Frontend (port 5173)

**Usage:**
```bash
# Windows
scripts\start-apps.bat

# Linux/Mac/Git Bash
scripts/start-apps.sh
```

**Prerequisites:**
- Databases must be running (use `start-databases` first)
- `npm install` run in both projects

---

### **stop-all** - Stop Everything
Stops all services (Docker + Node)

**What it does:**
- Kills all Node.js processes
- Stops Docker containers

**Usage:**
```bash
# Windows
scripts\stop-all.bat

# Linux/Mac/Git Bash
scripts/stop-all.sh
```

---

## 🔧 How It Works

### **Logging Format:**
- `[CLEANUP]` - Stopping old services
- `[DATABASE]` - Database operations
- `[APP]` - Application operations
- `[SUCCESS]` - Operation succeeded
- `[ERROR]` - Operation failed
- `[INFO]` - Information
- `[WAIT]` - Waiting for something

### **Cleanup Before Start:**
All scripts automatically:
✅ Kill old Node processes
✅ Stop Docker containers
✅ Free occupied ports
✅ Then start fresh

---

## 💡 Common Workflows

### **Daily Development:**
```bash
# Morning: start everything
scripts/start-all.bat

# Evening: stop everything
scripts/stop-all.bat
```

### **Only Backend Work:**
```bash
# Start databases once
scripts/start-databases.bat

# Then start apps
scripts/start-apps.bat
```

### **Restart After Changes:**
```bash
# Stop
scripts/stop-all.bat

# Start
scripts/start-all.bat
```

---

## 🐛 Troubleshooting

### **Port Already in Use**

All scripts automatically free ports before starting!

If issues persist:
```bash
# Stop everything
scripts/stop-all.bat

# Then try again
scripts/start-all.bat
```

### **Docker Not Starting**

Check Docker Desktop is running:
1. Open Docker Desktop
2. Wait for it to start
3. Run scripts again

### **Backend Connection Errors**

Make sure databases started:
```bash
# Check Docker containers
docker ps

# Should see: postgres, redis, milvus, etcd, minio
```

---

## 📊 What Gets Started

| Script | PostgreSQL | Redis | Milvus | Frontend | Backend |
|--------|-----------|-------|--------|----------|---------|
| `start-all` | ✅ Docker | ✅ Docker | ✅ Docker | ✅ Local | ✅ Local |
| `start-databases` | ✅ Docker | ✅ Docker | ✅ Docker | ❌ | ❌ |
| `start-apps` | ❌ | ❌ | ❌ | ✅ Local | ✅ Local |

---

## ✨ Benefits

✅ **Organized** - All scripts in one place
✅ **Clean** - Stops old processes first
✅ **Logged** - Clear status messages
✅ **Cross-platform** - Works on Windows, Linux, Mac
✅ **Simple** - One command to rule them all

---

**Happy coding! 🚀**
