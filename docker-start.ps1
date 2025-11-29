# ==============================================
# Docker Quick Start Script for Windows
# ==============================================
# This script helps you start the Secure Scrape Agent
# in either development or production mode
# ==============================================

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'prod', 'stop', 'clean', 'logs')]
    [string]$Mode = 'dev',
    
    [Parameter(Mandatory = $false)]
    [switch]$Detached
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
Write-Host ""
Write-Host "🐳 Secure Scrape Agent - Docker Manager" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""

# Check if Docker is running
Write-Info "Checking Docker status..."
try {
    docker info | Out-Null
    Write-Success "✓ Docker is running"
}
catch {
    Write-Error "✗ Docker is not running. Please start Docker Desktop and try again."
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Warning "⚠ .env file not found. Creating from .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Warning "⚠ Please edit .env file and add your API keys before continuing."
        Write-Info "Press any key to continue after editing .env..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    else {
        Write-Error "✗ .env.example not found. Cannot create .env file."
        exit 1
    }
}

# Execute based on mode
switch ($Mode) {
    'dev' {
        Write-Info "Starting in DEVELOPMENT mode..."
        Write-Info "This will start all services with hot reload enabled."
        Write-Host ""
        
        if ($Detached) {
            Write-Info "Running in detached mode (background)..."
            docker-compose -f docker-compose.dev.yml up --build -d
        }
        else {
            Write-Info "Running in attached mode (press Ctrl+C to stop)..."
            docker-compose -f docker-compose.dev.yml up --build
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Success "✓ Development environment started successfully!"
            Write-Host ""
            Write-Info "Access your services at:"
            Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
            Write-Host "  Backend:   http://localhost:3004" -ForegroundColor White
            Write-Host "  MCP:       http://localhost:4000" -ForegroundColor White
            Write-Host "  MinIO:     http://localhost:9001" -ForegroundColor White
            Write-Host ""
            if ($Detached) {
                Write-Info "To view logs: .\docker-start.ps1 -Mode logs"
                Write-Info "To stop: .\docker-start.ps1 -Mode stop"
            }
        }
    }
    
    'prod' {
        Write-Info "Starting in PRODUCTION mode..."
        Write-Info "This will build and start optimized production images."
        Write-Host ""
        
        # Production always runs detached
        docker-compose -f docker-compose.prod.yml up --build -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Success "✓ Production environment started successfully!"
            Write-Host ""
            Write-Info "Access your services at:"
            Write-Host "  Frontend:  http://localhost" -ForegroundColor White
            Write-Host "  Backend:   http://localhost:3004" -ForegroundColor White
            Write-Host ""
            Write-Info "To view logs: .\docker-start.ps1 -Mode logs"
            Write-Info "To stop: .\docker-start.ps1 -Mode stop"
        }
    }
    
    'stop' {
        Write-Info "Stopping all services..."
        Write-Host ""
        
        # Try to stop both dev and prod
        Write-Info "Stopping development containers..."
        docker-compose -f docker-compose.dev.yml down
        
        Write-Info "Stopping production containers..."
        docker-compose -f docker-compose.prod.yml down
        
        Write-Host ""
        Write-Success "✓ All services stopped"
    }
    
    'clean' {
        Write-Warning "⚠ This will remove all containers, networks, and volumes!"
        Write-Warning "⚠ All data will be lost. Are you sure? (y/N)"
        $confirmation = Read-Host
        
        if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
            Write-Info "Cleaning up Docker resources..."
            Write-Host ""
            
            docker-compose -f docker-compose.dev.yml down -v
            docker-compose -f docker-compose.prod.yml down -v
            
            Write-Host ""
            Write-Success "✓ Cleanup complete"
        }
        else {
            Write-Info "Cleanup cancelled"
        }
    }
    
    'logs' {
        Write-Info "Showing logs (press Ctrl+C to exit)..."
        Write-Host ""
        
        # Check which compose file is running
        $devRunning = docker-compose -f docker-compose.dev.yml ps -q
        $prodRunning = docker-compose -f docker-compose.prod.yml ps -q
        
        if ($devRunning) {
            docker-compose -f docker-compose.dev.yml logs -f
        }
        elseif ($prodRunning) {
            docker-compose -f docker-compose.prod.yml logs -f
        }
        else {
            Write-Warning "No services are currently running"
        }
    }
}

Write-Host ""
