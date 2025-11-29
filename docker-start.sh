#!/bin/bash

# ==============================================
# Docker Quick Start Script for Linux/Mac
# ==============================================
# This script helps you start the Secure Scrape Agent
# in either development or production mode
# ==============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Functions for colored output
print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_info() {
    echo -e "${CYAN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Banner
echo ""
echo -e "${MAGENTA}🐳 Secure Scrape Agent - Docker Manager${NC}"
echo -e "${MAGENTA}=========================================${NC}"
echo ""

# Parse arguments
MODE="${1:-dev}"
DETACHED="${2:-}"

# Show usage if help is requested
if [ "$MODE" = "--help" ] || [ "$MODE" = "-h" ]; then
    echo "Usage: ./docker-start.sh [mode] [options]"
    echo ""
    echo "Modes:"
    echo "  dev         Start in development mode (default)"
    echo "  prod        Start in production mode"
    echo "  stop        Stop all services"
    echo "  clean       Remove all containers and volumes"
    echo "  logs        Show logs from running services"
    echo ""
    echo "Options:"
    echo "  -d          Run in detached mode (background)"
    echo ""
    echo "Examples:"
    echo "  ./docker-start.sh              # Start dev mode (attached)"
    echo "  ./docker-start.sh dev -d       # Start dev mode (detached)"
    echo "  ./docker-start.sh prod         # Start production mode"
    echo "  ./docker-start.sh stop         # Stop all services"
    echo "  ./docker-start.sh logs         # View logs"
    echo ""
    exit 0
fi

# Check if Docker is running
print_info "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "✗ Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "✓ Docker is running"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "⚠ .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        print_warning "⚠ Please edit .env file and add your API keys before continuing."
        print_info "Press Enter to continue after editing .env..."
        read -r
    else
        print_error "✗ .env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Execute based on mode
case "$MODE" in
    dev)
        print_info "Starting in DEVELOPMENT mode..."
        print_info "This will start all services with hot reload enabled."
        echo ""
        
        if [ "$DETACHED" = "-d" ]; then
            print_info "Running in detached mode (background)..."
            docker-compose -f docker-compose.dev.yml up --build -d
        else
            print_info "Running in attached mode (press Ctrl+C to stop)..."
            docker-compose -f docker-compose.dev.yml up --build
        fi
        
        if [ $? -eq 0 ]; then
            echo ""
            print_success "✓ Development environment started successfully!"
            echo ""
            print_info "Access your services at:"
            echo -e "  Frontend:  ${WHITE}http://localhost:5173${NC}"
            echo -e "  Backend:   ${WHITE}http://localhost:3004${NC}"
            echo -e "  MCP:       ${WHITE}http://localhost:4000${NC}"
            echo -e "  MinIO:     ${WHITE}http://localhost:9001${NC}"
            echo ""
            if [ "$DETACHED" = "-d" ]; then
                print_info "To view logs: ./docker-start.sh logs"
                print_info "To stop: ./docker-start.sh stop"
            fi
        fi
        ;;
    
    prod)
        print_info "Starting in PRODUCTION mode..."
        print_info "This will build and start optimized production images."
        echo ""
        
        # Production always runs detached
        docker-compose -f docker-compose.prod.yml up --build -d
        
        if [ $? -eq 0 ]; then
            echo ""
            print_success "✓ Production environment started successfully!"
            echo ""
            print_info "Access your services at:"
            echo -e "  Frontend:  ${WHITE}http://localhost${NC}"
            echo -e "  Backend:   ${WHITE}http://localhost:3004${NC}"
            echo ""
            print_info "To view logs: ./docker-start.sh logs"
            print_info "To stop: ./docker-start.sh stop"
        fi
        ;;
    
    stop)
        print_info "Stopping all services..."
        echo ""
        
        # Try to stop both dev and prod
        print_info "Stopping development containers..."
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
        
        print_info "Stopping production containers..."
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        
        echo ""
        print_success "✓ All services stopped"
        ;;
    
    clean)
        print_warning "⚠ This will remove all containers, networks, and volumes!"
        print_warning "⚠ All data will be lost. Are you sure? (y/N)"
        read -r confirmation
        
        if [ "$confirmation" = "y" ] || [ "$confirmation" = "Y" ]; then
            print_info "Cleaning up Docker resources..."
            echo ""
            
            docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
            docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
            
            echo ""
            print_success "✓ Cleanup complete"
        else
            print_info "Cleanup cancelled"
        fi
        ;;
    
    logs)
        print_info "Showing logs (press Ctrl+C to exit)..."
        echo ""
        
        # Check which compose file is running
        if docker-compose -f docker-compose.dev.yml ps -q 2>/dev/null | grep -q .; then
            docker-compose -f docker-compose.dev.yml logs -f
        elif docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then
            docker-compose -f docker-compose.prod.yml logs -f
        else
            print_warning "No services are currently running"
        fi
        ;;
    
    *)
        print_error "Unknown mode: $MODE"
        echo "Use './docker-start.sh --help' for usage information"
        exit 1
        ;;
esac

echo ""
