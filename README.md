# 🏦 Loan Disbursement System

A comprehensive loan forecast and portfolio management system designed for American Plus Bank. This system provides advanced loan disbursement predictions using an S-curve algorithm, real-time portfolio visualization, and comprehensive data analytics.

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [To Contribute](#-to-contribute)

## ✨ Features

### 🎯 Core Capabilities
- **Real-time Dashboard**: Summary and visualization for forecasted data
- **CSV Data Upload**: Upload loan data in CSV format
- **Disbursement Forecasting**: Realistic model for disbursement predictions
- **Export Functionality**: Check and download forecast results

### 📊 Dashboard Metrics
- **Total Loans**: Count of loans
- **Total Loan Amount**: Sum of all loan principal amounts
- **Highest Forecasted Balance**: Peak projected outstanding balance
- **Data Points**: Total number of forecast data points generated

### 🔮 Forecasting Algorithm
- **S-Curve Model**: Sigmoid-based disbursement prediction
- **Time-based Progress**: Considers project timeline and completion percentage
- **Extended Date Handling**: Accounts for loan extensions up to 6 months
- **Dynamic Cutoff**: Automatic zero-balance after extended date + 180 days

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop**: Ensure Docker is installed and running
- **Git**: For cloning the repository
- **Minimum 4GB RAM**: For optimal performance

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Dionysos599/Loan-Disbursement-System.git
   cd loan-disbursement-system
   ```

2. **Start the System**
   ```bash
   # Build and start all services
   ./build.sh

   # Or start individual components
   ./build.sh --backend-only    # Backend service only
   ./build.sh --frontend-only   # Frontend application only
   ./build.sh --no-docker      # Build without Docker containers
   ```

3. **Access the Application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8081
   - **Health Check**: http://localhost:8081/api/loan-forecast/ping

4. **Verify Installation**
   ```bash
   # Check running services
   docker ps
   
   # Test system functionality
   ./test-system.sh
   ```

## 📖 Usage Guide

### 1. Upload Loan Data

1. **Access the Upload Interface**
   - Navigate to http://localhost:3000
   - Click on "Data Upload" section

2. **Prepare Your CSV File**
   - Ensure your CSV contains required columns (see [Data Format](#2-data-format))
   - File size limit: 50MB
   - Supported format: `.csv`

3. **Upload Process**
   - Select your CSV file
   - Choose forecast start month (e.g., "2024-11-01")
   - Click "Upload and Process"
   - Monitor upload progress

### 2. Data Format

#### Required CSV Columns

| Column Name | Type | Description | Example |
|-------------|------|-------------|---------|
| Loan Number | String | Unique loan identifier | "1234567890" |
| Loan Amount | Number | Principal amount | "500000" |
| Maturity Date | Date | Original maturity | "12/31/2025" |
| Extended Date | Date | Extended maturity | "6/30/2026" |
| Outstanding Balance | Number | Current balance | "350000" |
| Undisbursed Amount | Number | Remaining to disburse | "150000" |
| % of Completion | Number | Project completion | "45" |

#### Date Formats Supported
- `MM/dd/yyyy` (e.g., "12/31/2025")
- `M/d/yy` (e.g., "1/5/25")
- `yyyy-MM-dd` (e.g., "2025-12-31")

#### Sample CSV Structure
```csv
Loan Number,Customer Name,Loan Amount,Maturity Date,Extended Date,Outstanding Balance,Undisbursed Amount,% of Loan Drawn,% of Completion
L001234,John Doe,500000,12/31/2025,6/30/2026,350000,150000,70,45
L001235,Jane Smith,750000,6/30/2026,12/31/2026,600000,150000,80,60
```

### 2. View Dashboard

1. **Portfolio Overview**
   - Loans count
   - Total loan amount
   - Highest forecasted balance
   - Data points generated

2. **Interactive Charts**
   - Loan forecast timeline
   - Geographic distribution
   - Outstanding balance trends

### 3. Export Forecast Data

1. **Access Export Function**
   - Navigate to upload history
   - Select desired batch
   - Click "Download Forecast CSV"

2. **File Content**
   - Original loan data
   - Monthly forecast projections
   - Calculation metadata
   - Forecast start/end dates

### 4. Monitor Upload History

1. **View Past Uploads**
   - Check upload status (SUCCESS/FAILED/PROCESSING)
   - Review processing statistics
   - Access error logs if available

2. **Batch Management**
   - Each upload generates unique batch ID
   - Trace individual loan processing
   - Download historical forecasts




## 🔗 API Documentation

### Core Endpoints

#### Upload CSV File
```http
POST /api/loan-forecast/upload
Content-Type: multipart/form-data

Parameters:
- file: CSV file (multipart)
- startMonth: Forecast start date (YYYY-MM-DD)

Response: DataIngestionResponse with batch ID and processing results
```

#### Get Upload History
```http
GET /api/loan-forecast/upload-history

Response: List of all upload batches with metadata
```

#### Download Forecast CSV
```http
GET /api/loan-forecast/download/{batchId}

Response: CSV file with forecast data
```

#### Get Forecast Data
```http
GET /api/loan-forecast/upload-history/{batchId}/forecast-data

Response: JSON array of loan forecast data
```

#### Health Check
```http
GET /api/loan-forecast/ping

Response: Pong
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Upload Failed: Network Error
**Symptoms**: Upload fails with "Network error" message

**Solutions**:
- Verify backend service is running: `docker ps`
- Check backend logs: `docker logs loan-forecast-service`
- Ensure CSV format matches requirements
- Verify Docker Desktop is running

#### 2. Docker Build Failures
**Symptoms**: Build script reports Docker errors

**Solutions**:
- Start Docker Desktop
- Clean Docker cache: `docker system prune`
- Rebuild services: `./build.sh --docker-only`

#### 3. CSV Processing Errors
**Symptoms**: "Required column missing" errors

**Solutions**:
- Verify all required columns are present
- Check for hidden characters in column headers
- Ensure proper CSV encoding (UTF-8)
- Remove empty rows/columns

#### 4. Memory Issues
**Symptoms**: Services fail to start or crash

**Solutions**:
- Increase Docker memory allocation (minimum 4GB)
- Close unnecessary applications
- Monitor system resources: `docker stats`

### Log Locations
- **Backend Logs**: `docker logs loan-forecast-service`
- **Frontend Logs**: `docker logs loan-forecast-frontend`
- **Database Logs**: `docker logs loan-forecast-postgres`

### Performance Optimization
- Use SSD storage for Docker volumes
- Allocate sufficient RAM to Docker
- Process smaller CSV files (< 10MB) for better performance
- Clear browser cache if frontend issues persist

## 🤝 To Contribute

### Development Setup

#### Prerequisites
- **Java 17+**: For backend development
- **Node.js 18+**: For frontend development
- **Maven 3.8+**: For backend builds
- **Docker Desktop**: For containerization

#### Local Development Environment

1. **Backend Development**
   ```bash
   cd backend/loan-forecast
   mvn clean install
   mvn spring-boot:run
   # Backend runs on http://localhost:8081
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm start
   # Frontend runs on http://localhost:3000
   ```

3. **Database Setup** (Optional for local testing)
   ```bash
   cd docker
   docker-compose up postgres redis -d
   ```

### Code Structure

```
loan-disbursement-system/
├── backend/loan-forecast/         # Spring Boot backend service
│   ├── src/main/java/             # Java source code
│   ├── src/main/resources/        # Configuration files
│   └── pom.xml                    # Maven dependencies
├── frontend/                      # React frontend application
│   ├── src/components/            # React components
│   ├── src/services/              # API service layer
│   └── package.json               # npm dependencies
├── docker/                        # Docker configuration
│   ├── docker-compose.yml         # Service orchestration
│   └── init.sql                   # Database initialization
└── build.sh                       # Build automation script
```

### Development Guidelines

#### Backend Development

1. **Code Standards**
   - Follow Java naming conventions
   - Use Lombok for boilerplate reduction
   - Add comprehensive logging with @Slf4j
   - Write unit tests for service layer

2. **API Development**
   - Use RESTful endpoints
   - Include proper HTTP status codes
   - Add @CrossOrigin for frontend integration
   - Document endpoints with clear comments

3. **Database Changes**
   - Use JPA for data access
   - Include database migrations
   - Test with PostgreSQL locally

#### Frontend Development

1. **Code Standards**
   - Use TypeScript for type safety
   - Follow React functional component patterns
   - Implement proper error handling
   - Use Material-UI components consistently

2. **State Management**
   - Use React hooks for local state
   - Implement proper loading states
   - Handle errors gracefully

3. **API Integration**
   - Use centralized API service
   - Implement proper error handling
   - Add loading indicators

### Build Process

#### Build Script Options
```bash
./build.sh                    # Full build (backend + frontend + Docker)
./build.sh --backend-only     # Backend Maven + Docker build
./build.sh --frontend-only    # Frontend npm + Docker build
./build.sh --no-docker       # Build without Docker containers
./build.sh --docker-only     # Docker build only
```

#### Testing
```bash
# Backend tests
cd backend/loan-forecast && mvn test

# Frontend tests
cd frontend && npm test

# Integration tests
./test-system.sh
```

### Contribution Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Development**
   - Write code following established patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Testing**
   - Run unit tests: `mvn test` (backend), `npm test` (frontend)
   - Test full system: `./build.sh && ./test-system.sh`
   - Verify Docker builds successfully

4. **Submit Pull Request**
   - Ensure all tests pass
   - Update README if needed
   - Include clear description of changes

### Key Areas for Contribution

- **Algorithm Enhancement**: Improve S-curve forecasting accuracy
- **Dashboard Features**: Add new visualization components
- **Performance Optimization**: Enhance large file processing
- **Testing Coverage**: Expand unit and integration tests
- **Documentation**: Improve user guides and API docs
- **Mobile Responsiveness**: Enhance mobile user experience

### Getting Help

- **Documentation**: Check existing README and code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Code Review**: All contributions require peer review
- **Testing**: Ensure all tests pass before submitting

---

For questions or support, please open an issue in the project repository or contact the development team. 