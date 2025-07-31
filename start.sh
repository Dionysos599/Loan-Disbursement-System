#!/bin/bash

echo "🚀 Starting Lightweight Loan Forecast System"
echo "============================================="
echo "ℹ️  Architecture: Frontend-only React Application"
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
        echo -e "${RED}Start failed at: $1${NC}"
        exit 1
    fi
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js is installed ($(node --version))${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm is installed ($(npm --version))${NC}"

# Navigate to lightweight-system directory
cd lightweight-system

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    check_success "npm install"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo -e "${BLUE}💡 The application will be available at: http://localhost:3000${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
echo ""

npm start 