#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions with colors
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show service status function
show_status() {
    print_info "Current service status:"
    echo ""
    docker-compose ps
    echo ""
    print_info "Service health checks:"
    
    # Check backend services
    local services=("data-ingestion" "forecasting" "disbursement")
    for service in "${services[@]}"; do
        local port=""
        case $service in
            "data-ingestion") port="8081" ;;
            "forecasting") port="8082" ;;
            "disbursement") port="8080" ;;
        esac
        
        if curl -s "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            print_success "$service service is healthy (port: $port)"
        else
            print_warning "$service service may not be started (port: $port)"
        fi
    done
    
    # Check frontend
    if curl -s "http://localhost:3000" > /dev/null 2>&1; then
        print_success "Frontend service is healthy (port: 3000)"
    else
        print_warning "Frontend service may not be started (port: 3000)"
    fi
}

# Main execution
print_info "Starting build and deployment process..."

# Navigate to docker directory
cd /Users/lam/Documents/Work/American\ Plus\ Bank/loan-disbursement-system/docker

# Run the original build process
print_info "Building and starting services..."
./build.sh && docker-compose up -d --build && sleep 10 && ./test-system.sh

# Wait for services to stabilize
print_info "Waiting for services to stabilize..."
sleep 5

# Show status
echo ""
print_info "Checking service status..."
show_status

echo ""
print_success "Build process completed!"
print_info "Frontend is running on http://localhost:3000"
echo ""