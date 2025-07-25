# Docker Configuration

This directory contains Docker Compose configurations for different environments.

## Configuration Files

### `docker-compose.yml` (Development)
- **Purpose**: Local development environment
- **WebSocket URL**: `ws://localhost:8081/ws/progress` (for browser access)
- **API URL**: `http://localhost:8081/api` (for browser access)
- **Usage**: `docker compose up -d --build`

### `docker-compose.ci.yml` (CI/CD)
- **Purpose**: GitHub Actions CI environment
- **WebSocket URL**: `ws://loan-forecast-service:8081/ws/progress` (container-to-container)
- **API URL**: `http://loan-forecast-service:8081/api` (container-to-container)
- **Usage**: `docker compose -f docker-compose.ci.yml up -d --build`

## Environment Variables

### Frontend Environment Variables

The frontend application uses the following environment variables:

- `REACT_APP_API_URL`: Backend API base URL
- `REACT_APP_WS_URL`: WebSocket connection URL

### Environment-Specific Configurations

#### Development (Local)
```bash
REACT_APP_API_URL=http://localhost:8081/api
REACT_APP_WS_URL=ws://localhost:8081/ws/progress
```

#### CI/CD (GitHub Actions)
```bash
REACT_APP_API_URL=http://loan-forecast-service:8081/api
REACT_APP_WS_URL=ws://loan-forecast-service:8081/ws/progress
```

## Network Architecture

### Development Environment
```
Browser (localhost:3000) 
    ↓ (localhost:8081)
Backend Service (localhost:8081)
    ↓ (postgres:5432)
PostgreSQL Database
```

### CI Environment
```
Frontend Container (loan-forecast-frontend)
    ↓ (loan-forecast-service:8081)
Backend Service (loan-forecast-service)
    ↓ (postgres:5432)
PostgreSQL Database
```

## Services

- **loan-forecast-service**: Spring Boot backend (port 8081)
- **frontend**: React frontend (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **kafka**: Apache Kafka (port 9092)
- **zookeeper**: Apache Zookeeper (port 2181)

## Quick Start

### Development
```bash
cd docker
docker compose up -d --build
```

### CI Testing
```bash
cd docker
docker compose -f docker-compose.ci.yml up -d --build
```

## Troubleshooting

### WebSocket Connection Issues
- **Development**: Ensure backend is running on `localhost:8081`
- **CI**: Ensure containers are on the same Docker network

### Port Conflicts
- Check if ports 3000, 8081, 5432, 6379, 9092, 2181 are available
- Use `docker ps` to see running containers

### Network Issues
- Use `docker network ls` to check networks
- Use `docker network inspect` to debug connectivity 