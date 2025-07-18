#!/bin/bash

echo "Testing Frontend..."

# Test if Node.js is available
echo "1. Testing Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js is available: $(node --version)"
else
    echo "❌ Node.js is not available"
    exit 1
fi

# Test if npm is available
echo "2. Testing npm..."
if command -v npm &> /dev/null; then
    echo "✅ npm is available: $(npm --version)"
else
    echo "❌ npm is not available"
    exit 1
fi

# Test frontend compilation
echo "3. Testing frontend compilation..."
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✅ Frontend compiles successfully"
else
    echo "❌ Frontend compilation failed"
    exit 1
fi

# Test if dependencies are installed
echo "4. Testing dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies are installed"
else
    echo "⚠️  Dependencies not found, installing..."
    npm install
fi

echo ""
echo "Frontend Test Summary:"
echo "- Node.js and npm are available"
echo "- Frontend compiles successfully"
echo "- Dependencies are properly installed"
echo "- Ready to run with: npm start" 