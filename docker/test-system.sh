#!/bin/bash

echo "🧪 Testing Loan Disbursement System"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url")
    status_code=${response: -3}
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL (Status: $status_code)${NC}"
        return 1
    fi
}

# Test infrastructure services
echo -e "\n${YELLOW}Testing Infrastructure Services:${NC}"

# PostgreSQL check
if nc -z localhost 5432; then
    echo -e "Testing PostgreSQL Database... ${GREEN}✓ PASS${NC}"
else
    echo -e "Testing PostgreSQL Database... ${RED}✗ FAIL${NC}"
fi

# Redis check
if nc -z localhost 6379; then
    echo -e "Testing Redis Cache... ${GREEN}✓ PASS${NC}"
else
    echo -e "Testing Redis Cache... ${RED}✗ FAIL${NC}"
fi

# Test backend services
echo -e "\n${YELLOW}Testing Backend Services:${NC}"
test_endpoint "http://localhost:8080" "Disbursement Service" 401  # 401 is expected due to Spring Security
test_endpoint "http://localhost:8081/actuator/health" "Data Ingestion Service"
test_endpoint "http://localhost:8082/api/forecasting/health" "Forecasting Service"

# Test frontend
echo -e "\n${YELLOW}Testing Frontend:${NC}"
test_endpoint "http://localhost:3000" "React Frontend"

# Check container status
echo -e "\n${YELLOW}Container Status:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep loan-

echo -e "\n${GREEN}✅ System Test Complete!${NC}"
echo -e "\n${YELLOW}Access Points:${NC}"
echo "Frontend: http://localhost:3000"
echo "Disbursement Service: http://localhost:8080"
echo "Data Ingestion Service: http://localhost:8081"
echo "Forecasting Service: http://localhost:8082"
echo "PostgreSQL: localhost:5432"
echo "Redis: localhost:6379"

# Cleanup
rm -f /tmp/response.json /tmp/upload_response.json 