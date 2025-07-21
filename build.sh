#!/bin/bash

echo "🏗️  Building Simplified Loan Forecast System"
echo "============================================="
echo "ℹ️  Architecture: Single Core Service (loan-forecast-service)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Success${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        exit 1
    fi
}

# Build backend service
echo "📦 Building Core Backend Service (loan-forecast)..."
cd backend/loan-forecast
mvn clean package -DskipTests
check_success
cd ../..

# Build frontend
echo "📦 Building Frontend..."
cd frontend
npm install
check_success
npm run build
check_success
cd ..

echo ""
echo -e "${GREEN}🎉 Build Complete!${NC}"
echo ""
echo "🚀 To start the system:"
echo "  cd docker"
echo "  docker-compose up -d"
echo ""
echo "🧪 To test the system:"
echo "  ./test-system.sh"
echo ""
echo "📋 System Architecture:"
echo "  • Core Service: loan-forecast-service (Port 8081)"
echo "  • Frontend: React App (Port 3000)"
echo "  • Database: PostgreSQL (Port 5432)"
echo "  • Cache: Redis (Port 6379)"

cd docker
docker-compose up -d
cd ..