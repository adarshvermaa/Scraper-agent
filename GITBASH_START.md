# 🚀 Git Bash Quick Start

## Start Both Services

Open **Git Bash** in the project root and run:

```bash
./start-gitbash.sh
```

This will:
- ✅ Stop any existing node processes
- ✅ Open 2 new **PowerShell windows**:
  - Window 1: Backend server (port 3004)
  - Window 2: Frontend server (port 5173)

## Access Your App

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3004

## Stop Services

Just **close the two PowerShell windows** that opened, or press `Ctrl+C` in each.

## How It Works

The script uses `powershell.exe Start-Process` which is the most reliable way to open new windows from Git Bash on Windows.

## Troubleshooting

**If nothing happens:**
```bash
# Run with verbose output
bash -x ./start-gitbash.sh
```

**If ports are in use:**
```bash
# Kill all node processes first
taskkill //F //IM node.exe
# Then run the script again
./start-gitbash.sh
```

**If you see errors about paths:**
- Make sure you're in `/d/job-scraper` directory
- Run: `pwd` to check your current directory

---

**That's it! Enjoy coding! 🎉**
