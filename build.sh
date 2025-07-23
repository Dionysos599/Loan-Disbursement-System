#!/bin/bash

# Default build mode
BUILD_MODE="full"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backend-only)
            BUILD_MODE="backend"
            shift
            ;;
        -f|--frontend-only)
            BUILD_MODE="frontend"
            shift
            ;;
        -d|--docker-only)
            BUILD_MODE="docker"
            shift
            ;;
        -nd|--no-docker)
            BUILD_MODE="no-docker"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -b, --backend-only    Build only the backend service"
            echo "  -f, --frontend-only   Build only the frontend"
            echo "  -d, --docker-only     Only build and start Docker containers"
            echo "  -nd, --no-docker       Build backend and frontend but skip Docker"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🏗️  Building Simplified Loan Forecast System"
echo "============================================="
echo "ℹ️  Architecture: Single Core Service (loan-forecast-service)"
echo "🔧 Build Mode: $BUILD_MODE"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Success${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        echo -e "${RED}Build failed at: $1${NC}"
        exit 1
    fi
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
        echo -e "${YELLOW}💡 You can use --no-docker flag to build without Docker${NC}"
        exit 1
    fi
}

# Build backend service
build_backend() {
    echo "📦 Building Core Backend Service (loan-forecast)..."
    cd backend/loan-forecast
    mvn clean package -DskipTests
    check_success "Backend Maven build"
    cd ../..
}

# Build backend with Docker
build_backend_with_docker() {
    build_backend
    echo "🐳 Building Backend Docker Image..."
    cd docker
    docker-compose build loan-forecast-service
    check_success "Backend Docker build"
    echo "🚀 Restarting Backend Container..."
    docker-compose up -d loan-forecast-service
    check_success "Backend container restart"
    cd ..
}

# Build frontend
build_frontend() {
    echo "📦 Building Frontend..."
    cd frontend
    npm install
    check_success "Frontend npm install"
    npm run build
    check_success "Frontend build"
    cd ..
}

# Build frontend with Docker
build_frontend_with_docker() {
    build_frontend
    echo "🐳 Building Frontend Docker Image..."
    cd docker
    docker-compose build frontend
    check_success "Frontend Docker build"
    echo "🚀 Restarting Frontend Container..."
    docker-compose up -d frontend
    check_success "Frontend container restart"
    cd ..
}

# Build and start Docker containers
build_docker() {
    echo "🐳 Checking Docker..."
    check_docker
    echo -e "${GREEN}✅ Docker is running${NC}"
    
    echo "🐳 Building and starting Docker containers..."
    cd docker
    docker-compose build
    check_success "Docker build"
    docker-compose up -d
    check_success "Docker start"
    cd ..
}

# Execute based on build mode
case $BUILD_MODE in
    "backend")
        check_docker
        build_backend_with_docker
        ;;
    "frontend")
        check_docker
        build_frontend_with_docker
        ;;
    "docker")
        build_docker
        ;;
    "no-docker")
        docker-compose down
        build_backend
        build_frontend
        ;;
    "full")
        check_docker
        build_backend_with_docker
        build_frontend_with_docker
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Build Complete!${NC}"
echo ""
echo "🧪 To test the system:"
echo "  ./test-system.sh"
echo ""
echo "📋 System Architecture:"
echo "  • Core Service: loan-forecast-service (Port 8081)"
echo "  • Frontend: React App (Port 3000)"
echo "  • Database: PostgreSQL (Port 5432)"
echo "  • Cache: Redis (Port 6379)"
echo ""
echo -e "${BLUE}💡 Pro Tips:${NC}"
echo "  • Use './build.sh --no-docker' if Docker is not available"
echo "  • Use './build.sh --backend-only' for faster backend-only builds"
echo "  • Use './build.sh --help' for all options"
