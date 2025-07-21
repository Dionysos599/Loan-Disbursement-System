#!/bin/bash

echo "�� Comprehensive Loan Forecast System Test"
echo "=========================================="
echo "ℹ️  系统已简化为单核心服务架构 (loan-forecast-service)"

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

# Java/Maven check
if command -v java &> /dev/null && command -v mvn &> /dev/null; then
    echo -e "Java/Maven Environment... ${GREEN}✓ PASS${NC}"
else
    echo -e "Java/Maven Environment... ${RED}✗ FAIL${NC}"
fi

# Test infrastructure services
echo -e "\n${BLUE}Testing Infrastructure Services:${NC}"

# PostgreSQL check
if nc -z localhost 5432 2>/dev/null; then
    echo -e "PostgreSQL Database... ${GREEN}✓ PASS${NC}"
else
    echo -e "PostgreSQL Database... ${RED}✗ FAIL${NC}"
fi

# Redis check
if nc -z localhost 6379 2>/dev/null; then
    echo -e "Redis Cache... ${GREEN}✓ PASS${NC}"
else
    echo -e "Redis Cache... ${RED}✗ FAIL${NC}"
fi

# Test core backend service (runtime)
echo -e "\n${BLUE}Testing Core Backend Service (Runtime):${NC}"
test_endpoint "http://localhost:8081/actuator/health" "Loan Forecast Service (Core)"

# Test backend compilation
echo -e "\n${BLUE}Testing Backend Compilation:${NC}"

# Test loan-forecast compilation
echo -n "Loan Forecast Service Compilation... "
if cd backend/loan-forecast && mvn clean compile -q > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    cd - > /dev/null
else
    echo -e "${RED}✗ FAIL${NC}"
    cd - > /dev/null
fi

# Test frontend
echo -e "\n${BLUE}Testing Frontend:${NC}"

# Frontend runtime test
test_endpoint "http://localhost:3000" "React Frontend (Runtime)"

# Frontend compilation test
echo -n "Frontend Compilation... "
if cd frontend && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    cd - > /dev/null
else
    echo -e "${RED}✗ FAIL${NC}"
    cd - > /dev/null
fi

# Frontend dependencies check
echo -n "Frontend Dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${YELLOW}⚠ MISSING${NC}"
fi

# Check container status
echo -e "\n${BLUE}Container Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep loan-forecast || echo "No loan-forecast containers running"

# Test key API endpoints
echo -e "\n${BLUE}Testing Key API Endpoints:${NC}"
test_endpoint "http://localhost:8081/api/loan-forecast/upload-history" "Upload History API"
test_endpoint "http://localhost:8081/api/loan-forecast/upload-history/latest" "Latest Upload API"

echo -e "\n${GREEN}✅ Comprehensive System Test Complete!${NC}"
echo -e "\n${YELLOW}Simplified System Architecture:${NC}"
echo "Core Service: http://localhost:8081 (Loan Forecast Service)"
echo "Frontend: http://localhost:3000"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"

echo -e "\n${YELLOW}Quick Commands:${NC}"
echo "Restart Backend: ./reload-backend.sh"
echo "Start Frontend: cd frontend && npm start"
echo "View Logs: docker-compose -f docker/docker-compose.yml logs -f loan-forecast-service"

# Cleanup
rm -f /tmp/response.json /tmp/upload_response.json 