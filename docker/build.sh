#!/bin/bash

echo "Building backend services..."

# Build disbursement service
echo "Building disbursement service..."
cd ../backend/disbursement-service
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "Failed to build disbursement service"
    exit 1
fi

# Build data ingestion service
echo "Building data ingestion service..."
cd ../data-ingestion
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "Failed to build data ingestion service"
    exit 1
fi

# Build forecasting service
echo "Building forecasting service..."
cd ../forecasting-service
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo "Failed to build forecasting service"
    exit 1
fi

echo "All backend services built successfully!"
echo "You can now run: docker-compose up -d" 