#!/bin/bash

echo "🧪 Testing Lightweight Loan Forecast System"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null)
    status_code=${response: -3}
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL (Status: $status_code)${NC}"
        return 1
    fi
}

# Test development environment
echo -e "\n${BLUE}Testing Development Environment:${NC}"

# Node.js check
if command -v node &> /dev/null; then
    echo -e "Node.js Environment... ${GREEN}✓ PASS ($(node --version))${NC}"
else
    echo -e "Node.js Environment... ${RED}✗ FAIL${NC}"
fi

# npm check
if command -v npm &> /dev/null; then
    echo -e "npm Package Manager... ${GREEN}✓ PASS ($(npm --version))${NC}"
else
    echo -e "npm Package Manager... ${RED}✗ FAIL${NC}"
fi

# Test frontend compilation
echo -e "\n${BLUE}Testing Frontend Compilation:${NC}"

# Frontend compilation test
echo -n "Frontend Compilation... "
if cd lightweight-system && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    cd - > /dev/null
else
    echo -e "${RED}✗ FAIL${NC}"
    cd - > /dev/null
fi

# Frontend dependencies check
echo -n "Frontend Dependencies... "
if [ -d "lightweight-system/node_modules" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ MISSING${NC}"
fi

# Test frontend runtime (if running)
echo -e "\n${BLUE}Testing Frontend Runtime:${NC}"
test_endpoint "http://localhost:3000" "React Frontend (Runtime)"

echo -e "\n${GREEN}✅ Lightweight System Test Complete!${NC}"
echo -e "\n${YELLOW}System Architecture:${NC}"
echo "Frontend: http://localhost:3000 (React Application)"
echo "Storage: Browser localStorage"
echo "Processing: Client-side CSV processing"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo "Start System: ./start.sh"
echo "Build Frontend: cd lightweight-system && npm run build"
echo "Test Frontend: cd lightweight-system && npm test"

# Cleanup
rm -f /tmp/response.json 