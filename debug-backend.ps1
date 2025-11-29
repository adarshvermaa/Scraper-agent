# Debug Backend Script
# This script starts the backend and tails the output

Write-Host "Starting Secure Scrape Agent Backend on Port 3002..." -ForegroundColor Green

# Set environment variable for port
$env:PORT = 3002

# Navigate to backend directory
Set-Location ".\secure-scrape-agent-backend"

# Start the backend and pipe output to Tee-Object to see it in console and save to file
npm run start:dev | Tee-Object -FilePath "backend-debug.log"
