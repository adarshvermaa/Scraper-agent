# 📜 Docker Start Scripts Reference

This document explains all the available start scripts for the Secure Scrape Agent Docker setup.

## 🎯 Available Scripts

### Cross-Platform Scripts

| Script | Platform | Purpose |
|--------|----------|---------|
| `docker-start.ps1` | Windows | Full-featured PowerShell script with all options |
| `docker-start.sh` | Linux/Mac | Full-featured Bash script with all options |
| `start-dev.sh` | Linux/Mac | Quick development start |
| `start-prod.sh` | Linux/Mac | Quick production start |
| `stop-all.sh` | Linux/Mac | Stop all services |

---

## 🪟 Windows (PowerShell)

### Main Script: `docker-start.ps1`

**Full syntax:**
```powershell
.\docker-start.ps1 [-Mode <mode>] [-Detached]
```

**Modes:**
- `dev` - Development mode (default)
- `prod` - Production mode
- `stop` - Stop all services
- `clean` - Remove all containers and volumes
- `logs` - Show logs

**Examples:**
```powershell
# Start development
.\docker-start.ps1

# Start development in background
.\docker-start.ps1 -Detached

# Start production
.\docker-start.ps1 -Mode prod

# View logs
.\docker-start.ps1 -Mode logs

# Stop everything
.\docker-start.ps1 -Mode stop

# Clean up (⚠️ deletes data)
.\docker-start.ps1 -Mode clean
```

---

## 🐧 Linux/Mac (Bash)

### Setup (First Time Only)

Make scripts executable:
```bash
chmod +x docker-start.sh
chmod +x start-dev.sh
chmod +x start-prod.sh
chmod +x stop-all.sh
```

### Main Script: `docker-start.sh`

**Full syntax:**
```bash
./docker-start.sh [mode] [options]
```

**Modes:**
- `dev` - Development mode (default)
- `prod` - Production mode
- `stop` - Stop all services
- `clean` - Remove all containers and volumes
- `logs` - Show logs

**Options:**
- `-d` - Run in detached mode (background)

**Examples:**
```bash
# Start development
./docker-start.sh dev

# Start development in background
./docker-start.sh dev -d

# Start production
./docker-start.sh prod

# View logs
./docker-start.sh logs

# Stop everything
./docker-start.sh stop

# Clean up (⚠️ deletes data)
./docker-start.sh clean

# Show help
./docker-start.sh --help
```

### Quick Start Scripts

**`start-dev.sh`** - Quick development start (attached mode)
```bash
./start-dev.sh
```
- Checks for `.env` file
- Starts all services in development mode
- Runs in foreground (see logs in terminal)
- Press Ctrl+C to stop

**`start-prod.sh`** - Quick production start (detached mode)
```bash
./start-prod.sh
```
- Checks for `.env` file
- Starts all services in production mode
- Runs in background
- Shows URLs after startup

**`stop-all.sh`** - Stop all services
```bash
./stop-all.sh
```
- Stops both dev and prod containers
- Doesn't remove volumes

---

## 🔄 Script Comparison

### Full-Featured Scripts

Both `docker-start.ps1` and `docker-start.sh` provide:
- ✅ Multiple modes (dev, prod, stop, clean, logs)
- ✅ Environment file checking
- ✅ Docker status verification
- ✅ Colored output
- ✅ Helpful error messages
- ✅ Service URL display

**When to use:**
- You want full control with multiple options
- You need to switch between dev and prod frequently
- You want detailed status messages

### Simple Scripts (Linux/Mac only)

The simple scripts (`start-dev.sh`, `start-prod.sh`, `stop-all.sh`) provide:
- ✅ Quick one-command startup
- ✅ Sensible defaults
- ✅ Minimal configuration

**When to use:**
- You just want to start quickly
- You prefer dedicated scripts for each action
- You like simple, focused tools

---

## 📋 Common Workflows

### First Time Setup

**Windows:**
```powershell
# 1. Copy environment file
copy .env.example .env

# 2. Edit .env and add API keys
notepad .env

# 3. Start development
.\docker-start.ps1
```

**Linux/Mac:**
```bash
# 1. Make scripts executable
chmod +x *.sh

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env and add API keys
nano .env  # or vim, or your editor

# 4. Start development
./docker-start.sh dev
# or
./start-dev.sh
```

### Daily Development

**Windows:**
```powershell
# Morning: Start services
.\docker-start.ps1 -Detached

# Evening: Stop services
.\docker-start.ps1 -Mode stop
```

**Linux/Mac:**
```bash
# Morning: Start services
./docker-start.sh dev -d

# Evening: Stop services
./stop-all.sh
```

### Switching Between Dev and Prod

**Windows:**
```powershell
# Stop dev
.\docker-start.ps1 -Mode stop

# Start prod
.\docker-start.ps1 -Mode prod

# Back to dev
.\docker-start.ps1 -Mode stop
.\docker-start.ps1
```

**Linux/Mac:**
```bash
# Stop dev
./docker-start.sh stop

# Start prod
./start-prod.sh

# Back to dev
./docker-start.sh stop
./start-dev.sh
```

### Viewing Logs

**Windows:**
```powershell
# Using script
.\docker-start.ps1 -Mode logs

# Or directly
docker-compose -f docker-compose.dev.yml logs -f
```

**Linux/Mac:**
```bash
# Using script
./docker-start.sh logs

# Or directly
docker-compose -f docker-compose.dev.yml logs -f
```

### Clean Reset

**Windows:**
```powershell
.\docker-start.ps1 -Mode clean
```

**Linux/Mac:**
```bash
./docker-start.sh clean
```

---

## 🎨 Output Examples

### Successful Start (dev)

```
🐳 Secure Scrape Agent - Docker Manager
=========================================

✓ Docker is running
Starting in DEVELOPMENT mode...
Building and starting all services...

✓ Development environment started successfully!

Access your services at:
  Frontend:  http://localhost:5173
  Backend:   http://localhost:3004
  MCP:       http://localhost:4000
  MinIO:     http://localhost:9001
```

### Script Help

```bash
$ ./docker-start.sh --help

Usage: ./docker-start.sh [mode] [options]

Modes:
  dev         Start in development mode (default)
  prod        Start in production mode
  stop        Stop all services
  clean       Remove all containers and volumes
  logs        Show logs from running services

Options:
  -d          Run in detached mode (background)

Examples:
  ./docker-start.sh              # Start dev mode (attached)
  ./docker-start.sh dev -d       # Start dev mode (detached)
  ./docker-start.sh prod         # Start production mode
  ./docker-start.sh stop         # Stop all services
  ./docker-start.sh logs         # View logs
```

---

## 🐛 Troubleshooting

### Permission Denied (Linux/Mac)

**Problem:**
```bash
bash: ./docker-start.sh: Permission denied
```

**Solution:**
```bash
chmod +x docker-start.sh
```

### Script Not Found (Windows)

**Problem:**
```powershell
The term 'docker-start.ps1' is not recognized...
```

**Solution:**
```powershell
# Use .\ prefix
.\docker-start.ps1
```

### Execution Policy Error (Windows)

**Problem:**
```
cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
# Allow scripts for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
.\docker-start.ps1
```

### Docker Not Running

Both scripts will show:
```
✗ Docker is not running. Please start Docker and try again.
```

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully initialize
3. Run script again

---

## 💡 Tips

1. **Use tab completion**: Start typing the script name and press Tab
2. **Background mode**: Use `-d` or `-Detached` for background execution
3. **Check status**: Use `docker-compose ps` to see running containers
4. **Quick restart**: Stop and start again for clean restart
5. **Logs**: Always check logs if something isn't working

---

## 📚 See Also

- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - Quick start guide
- [DOCKER.md](./DOCKER.md) - Complete Docker documentation
- [DOCKER_SETUP_COMPLETE.md](./DOCKER_SETUP_COMPLETE.md) - Setup verification

---

**Happy scripting! 🚀**
