# 🚀 Complete Setup Guide

## Current Situation

Your **frontend and backend are running locally** but can't connect to Redis and Milvus because they're not running.

---

## ✅ **Solution: 3 Easy Options**

### **Option 1: Run Everything in Docker** (Simplest)

Stop your local services and use Docker for everything:

**Git Bash:**
```bash
# Stop local services (close PowerShell windows)
# Then run:
./docker-start.sh dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3004

✅ **Pros:** Everything works, all dependencies included  
❌ **Cons:** Slower startup, uses more RAM

---

### **Option 2: Mock Dependencies** (Fastest for Frontend Dev)

If you're only working on frontend, you can disable backend features temporarily.

**Edit `.env` in backend:**
```env
# Disable features that need Redis/Milvus
REDIS_ENABLED=false
MILVUS_ENABLED=false
```

Then backend will skip connecting to them.

✅ **Pros:** Fast, lightweight  
❌ **Cons:** Some features won't work

---

### **Option 3: Docker for DBs Only** (Best of Both Worlds)

Use Docker only for databases, run frontend/backend locally.

**First, completely stop Docker:**
```bash
docker-compose -f docker-compose.dev.yml down
docker stop $(docker ps -aq)
```

**Then start just databases:**
```bash
docker-compose -f docker-compose.dev.yml up -d postgres redis milvus etcd minio
```

**Check status:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

✅ **Pros:** Fast development, all features work  
❌ **Cons:** Need to manage two things

---

## 🎯 **Recommended for You**

Since you already have the local scripts working, I recommend **Option 1** for now:

### Quick Steps:

1. **Close the 2 PowerShell windows** (frontend & backend)

2. **Start everything with Docker:**
   ```bash
   ./docker-start.sh dev
   ```

3. **Wait ~30 seconds** for all services to start

4. **Access:** http://localhost:5173

This gives you the complete working environment with zero configuration!

---

## 🔍 **Current Port Issue**

The Redis port (6379) is being held by Docker's network stack. The cleanest solution is to restart Docker Desktop:

1. Right-click Docker Desktop icon
2. Select "Restart"
3. Wait for it to restart
4. Then run: `docker-compose -f docker-compose.dev.yml up -d`

---

## 📝 **What I Recommend RIGHT NOW**

**Simplest path forward:**

1. Close your local frontend/backend windows
2. Run: `./docker-start.sh dev`  
3. Everything will work! ✨

**Want to troubleshoot the hybrid setup later?** That's fine - but for now, Docker gives you a working system immediately.

---

**What do you prefer?** 🤔
