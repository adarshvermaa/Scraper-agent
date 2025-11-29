# Debug Frontend Script
# This script starts the frontend

Write-Host "Starting Secure Scrape Agent Frontend..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location ".\secure-scrape-agent-frontend"

# Start the frontend
npm run dev
