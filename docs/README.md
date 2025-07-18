# Loan Disbursement Forecasting & Monitoring System

A comprehensive web application for monitoring and forecasting construction loan disbursements using S-curve mathematical modeling. This system helps banks manage capital exposure limits and predict cash flow for construction, multifamily, and commercial real estate (CRE) loans through advanced data ingestion and forecasting capabilities.

## 🏗️ Architecture Overview

```
loan-disbursement-system/
├── backend/                    # Microservices architecture
│   ├── disbursement-service/   # Core loan management service
│   ├── data-ingestion/         # CSV data processing service
│   ├── forecasting-service/    # Advanced forecasting engine
│   └── api-gateway/           # API gateway (future)
├── frontend/                   # React TypeScript application
├── docker/                     # Docker configuration
│   ├── docker-compose.yml      # Multi-container setup
│   ├── build.sh               # Backend build script
│   ├── test-system.sh         # System test script
│   └── init.sql               # Database initialization
├── backend/data/               # Sample data files
│   └── CLL_report_113124.csv   # Sample CLL report data
└── docs/                      # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Java 17+** (for backend services)
- **Node.js 18+** (for frontend)
- **Docker & Docker Compose** (for infrastructure)
- **Maven 3.6+** (for backend builds)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd loan-disbursement-system
```

### 2. Start Infrastructure with Docker (Recommended)

```bash
# Navigate to docker directory
cd docker

# Build backend services first
./build.sh

# Start all services with Docker Compose
docker-compose up -d
```

**Expected Output:**
```
Building backend services...
Building disbursement service...
[INFO] BUILD SUCCESS
Building data ingestion service...
[INFO] BUILD SUCCESS
Building forecasting service...
[INFO] BUILD SUCCESS
All backend services built successfully!

Creating loan-postgres ... done
Creating loan-redis    ... done
Creating loan-disbursement-service ... done
Creating loan-data-ingestion-service ... done
Creating loan-forecasting-service ... done
Creating loan-frontend ... done
```

### 3. Verify System Status

```bash
# Run comprehensive system test
./test-system.sh
```

**Expected Test Results:**
```
🧪 Testing Loan Disbursement System
==================================

Testing Infrastructure Services:
Testing PostgreSQL Database... ✓ PASS
Testing Redis Cache... ✓ PASS

Testing Backend Services:
Testing Disbursement Service... ✓ PASS
Testing Data Ingestion Service... ✓ PASS
Testing Forecasting Service... ✓ PASS

Testing Frontend:
Testing React Frontend... ✓ PASS

Testing CSV Upload:
Testing CSV file upload... ✓ PASS

✅ System Test Complete!
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Disbursement Service:** http://localhost:8080
- **Data Ingestion Service:** http://localhost:8081
- **Forecasting Service:** http://localhost:8082
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### 5. Alternative: Manual Service Startup

If you prefer to run services individually:

#### Data Ingestion Service
```bash
cd backend/data-ingestion
mvn clean package
mvn spring-boot:run
```
**Access:** http://localhost:8081

#### Forecasting Service
```bash
cd backend/forecasting-service
mvn clean package
mvn spring-boot:run
```
**Access:** http://localhost:8082

#### Disbursement Service
```bash
cd backend/disbursement-service
mvn clean package
mvn spring-boot:run
```
**Access:** http://localhost:8080

#### Frontend
```bash
cd frontend
npm install
npm start
```
**Access:** http://localhost:3000

## 📊 System Features

### 1. Data Ingestion & Processing
- **CSV Upload** - Drag-and-drop CSV file upload with validation
- **Data Processing** - Automatic parsing and cleaning of loan data
- **Batch Processing** - Handle large datasets with progress tracking
- **Data Validation** - Comprehensive validation of loan information
- **Sample Data** - Pre-loaded CLL report with 45 real loan records

### 2. Advanced Forecasting
- **S-Curve Modeling** - Sigmoid function-based disbursement prediction
- **Multiple Scenarios** - Optimistic, Conservative, and Linear forecasts
- **Custom Parameters** - Adjustable steepness and midpoint for S-curve
- **Confidence Levels** - Statistical confidence indicators for predictions

### 3. Portfolio Dashboard
- **Total Exposure Overview** - Real-time portfolio exposure across all loan types
- **Exposure by Type** - Breakdown by Construction, Multifamily, and CRE loans
- **Monthly Projections** - Forecasted exposure over time
- **Visual Analytics** - Interactive charts and data visualization

### 4. Loan Management
- **Loan List** - Searchable and filterable portfolio view
- **Loan Details** - Individual loan management with progress tracking
- **S-Curve Visualization** - Disbursement schedule charts
- **Progress Updates** - Real-time project completion tracking

## 📁 Sample Data

The system includes a sample CLL (Construction Loan List) report with 45 real loan records:

**File:** `backend/data/CLL_report_113124.csv`

**Data Includes:**
- 45 construction loans totaling $200M+ in exposure
- Various property types: SFR, PUD, Apartment, Hotel, Industrial, Mixed-Use, etc.
- Real loan amounts ranging from $1.8M to $20M
- Current completion percentages and outstanding balances
- Geographic distribution across Southern California

**Sample Records:**
```csv
"Loan Number",Customer Name,Loan Amount,"Maturity Date",Property Type,LTC Ratio,LTV Ratio,Interest Rate,"Outstanding Balance","Undisbursed Amount",% of Loan Drawn,% of Completion
1078966002,"Dali V, LLC","$4,400,000.00",9/15/2025,2 SFR,62%,75%,8.75%,"$1,061,446.60","$3,338,553.40",24%,6%
1120366001,Bowden Development Inc,"$1,930,000.00",11/27/2024,4 PUD,70%,59%,9.38%,"$1,813,488.26","$0.00",100%,72%
```

## 🔧 API Reference

### Data Ingestion Endpoints

#### Upload CSV File
```http
POST /api/data-ingestion/upload
Content-Type: multipart/form-data

file: [CSV_FILE]
```

**Response:**
```json
{
  "batchId": "BATCH_A1B2C3D4",
  "status": "SUCCESS",
  "totalRecords": 45,
  "processedRecords": 45,
  "failedRecords": 0,
  "processedAt": "2024-01-15T10:30:00",
  "message": "Successfully processed 45 loan records"
}
```

#### Generate Forecast
```http
POST /api/data-ingestion/forecast
Content-Type: application/json

{
  "batchId": "BATCH_A1B2C3D4",
  "forecastStartDate": "2024-01-01",
  "forecastEndDate": "2026-12-31",
  "forecastModel": "S-curve",
  "parameters": {
    "sCurveSteepness": 6.0,
    "sCurveMidpoint": 0.4,
    "completionRate": 0.8,
    "riskAdjustment": 0.1
  }
}
```

### Forecasting Endpoints

#### Generate Forecast
```http
POST /api/forecasting/generate
Content-Type: application/json

{
  "loanNumber": "LOAN-001",
  "totalLoanAmount": 5000000,
  "currentDrawnAmount": 1000000,
  "currentCompletion": 20,
  "startDate": "2024-01-01",
  "maturityDate": "2025-12-31",
  "forecastStartDate": "2024-07-01",
  "forecastEndDate": "2026-06-30",
  "forecastModel": "S-curve",
  "steepness": 6.0,
  "midpoint": 0.4
}
```

**Response:**
```json
{
  "forecastId": "FCST_A1B2C3D4",
  "batchId": "BATCH_A1B2C3D4",
  "status": "COMPLETED",
  "generatedAt": "2024-01-15T10:35:00",
  "forecastStartDate": "2024-07-01T00:00:00",
  "forecastEndDate": "2026-06-30T00:00:00",
  "forecastModel": "S-curve",
  "forecastData": [
    {
      "loanNumber": "LOAN-001",
      "date": "2024-07-01",
      "cumulativeAmount": 1250000,
      "monthlyAmount": 250000,
      "percentComplete": 25.0,
      "forecastType": "forecast",
      "scenarioName": "S-Curve",
      "confidenceLevel": 0.85
    }
  ],
  "summary": {
    "totalForecastedAmount": 5000000,
    "averageMonthlyDisbursement": 208333,
    "peakMonth": "2025-03-01",
    "peakAmount": 350000,
    "totalDataPoints": 24
  }
}
```

### Loan Endpoints

#### Get Loan Details
```http
GET /api/loans/{loanId}
```

**Response:**
```json
{
  "loanId": "LOAN-001",
  "customerName": "ABC Construction Co.",
  "loanAmount": 2500000,
  "startDate": "2024-01-15",
  "maturityDate": "2025-01-15",
  "propertyType": "Construction",
  "currentProgress": {
    "percentComplete": 0.35,
    "outstandingBalance": 875000,
    "asOfDate": "2024-07-01"
  },
  "schedule": [
    {
      "month": "2024-01-01",
      "cumulativeAmount": 2472.62,
      "monthlyAmount": 2472.62
    }
  ]
}
```

#### Calculate Schedule
```http
POST /api/loans/{loanId}/calculate-schedule
Content-Type: application/json

{
  "fromDate": "2024-01-01",
  "toDate": "2025-12-31",
  "currentComplete": 0.35
}
```

#### Update Progress
```http
PUT /api/loans/{loanId}/progress
Content-Type: application/json

{
  "percentComplete": 0.45,
  "outstandingBalance": 750000,
  "asOfDate": "2024-08-01"
}
```

#### Extend Maturity
```http
PUT /api/loans/{loanId}/extend
Content-Type: application/json

{
  "newMaturityDate": "2025-06-15"
}
```

### Portfolio Endpoints

#### Get Portfolio Exposure
```http
GET /api/portfolio/exposure
```

**Response:**
```json
{
  "totalExposure": 9300000,
  "exposureByType": {
    "Construction": 2500000,
    "Multifamily": 1800000,
    "CRE": 5000000
  },
  "monthlyProjections": [
    {
      "month": "2024-08-01",
      "totalExposure": 9500000,
      "constructionExposure": 2600000,
      "multifamilyExposure": 1850000,
      "creExposure": 5050000
    }
  ]
}
```

## 🛠️ Development Guide

### Backend Development

#### Project Structure
```
backend/disbursement-service/src/main/java/com/bankplus/disbursement_service/
├── DisbursementServiceApplication.java    # Main application class
├── Loan.java                              # JPA entity
├── LoanProgress.java                      # JPA entity
├── LoanSchedule.java                      # JPA entity
├── LoanRepository.java                    # Data access
├── LoanService.java                       # Business logic
├── DisbursementCalculator.java           # S-curve calculations
├── LoanController.java                    # REST endpoints
├── PortfolioController.java               # Portfolio endpoints
├── RedisConfig.java                       # Redis configuration
└── dto/                                   # Data transfer objects
    ├── LoanDetailResponse.java
    ├── CalculateScheduleRequest.java
    ├── UpdateProgressRequest.java
    └── ExtendMaturityRequest.java
```

#### Adding New Features

1. **Create Entity** (if needed):
```java
@Entity
@Table(name = "new_table")
public class NewEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Add fields with appropriate annotations
}
```

2. **Create Repository**:
```java
public interface NewEntityRepository extends JpaRepository<NewEntity, Long> {
    // Add custom query methods if needed
}
```

3. **Create Service**:
```java
@Service
public class NewService {
    @Autowired
    private NewEntityRepository repository;
    
    // Add business logic methods
}
```

4. **Create Controller**:
```java
@RestController
@RequestMapping("/api/new-feature")
public class NewController {
    @Autowired
    private NewService service;
    
    @GetMapping
    public ResponseEntity<?> getData() {
        // Implement endpoint
    }
}
```

5. **Add Tests**:
```java
@SpringBootTest
class NewServiceTests {
    @Test
    void testNewFeature() {
        // Add test cases
    }
}
```

#### S-Curve Formula Implementation

The core S-curve calculation is in `DisbursementCalculator.java`:

```java
// Excel formula translated to Java:
// =IF(R$4 > $E5 + 181, 0, $M5 + $N5 * (1 / (1 + EXP(-12 * ((($P5 + ((R$4 - $Q$4)/($E5 - $Q$4))*(1 - $P5)) - 0.5))))))

public static BigDecimal calculateDisbursement(
    LocalDate forecastDate,
    LocalDate maturityDate,
    BigDecimal outstandingBalance,
    BigDecimal undisbursedAmount,
    double percentComplete,
    LocalDate startDate
) {
    // Check 181-day cutoff
    if (forecastDate.isAfter(maturityDate.plusDays(181))) {
        return BigDecimal.ZERO;
    }
    
    // Calculate time progress
    double timeProgress = (double) (forecastDate.toEpochDay() - startDate.toEpochDay()) /
                         (maturityDate.toEpochDay() - startDate.toEpochDay());
    
    // Calculate S-curve input
    double x = percentComplete + timeProgress * (1 - percentComplete);
    
    // Apply sigmoid function
    double sCurve = 1.0 / (1.0 + Math.exp(-12.0 * (x - 0.5)));
    
    // Calculate final amount
    return outstandingBalance.add(undisbursedAmount.multiply(BigDecimal.valueOf(sCurve)));
}
```

### Frontend Development

#### Project Structure
```
frontend/src/
├── App.tsx                    # Main application component
├── types/
│   └── loan.ts               # TypeScript interfaces
├── services/
│   └── api.ts                # API service functions
├── components/
│   ├── Layout.tsx            # Navigation and theme
│   ├── PortfolioDashboard.tsx # Portfolio overview
│   ├── LoanList.tsx          # Loan portfolio list
│   ├── LoanDetails.tsx       # Individual loan management
│   ├── DataUpload.tsx        # CSV file upload component
│   └── ForecastVisualization.tsx # Forecast charts and tables
└── index.tsx                 # Application entry point
```

#### Adding New Components

1. **Create Component**:
```typescript
import React from 'react';
import { Box, Typography } from '@mui/material';

interface NewComponentProps {
  data: any;
  onAction: (id: string) => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ data, onAction }) => {
  return (
    <Box>
      <Typography variant="h6">New Component</Typography>
      {/* Add your component content */}
    </Box>
  );
};

export default NewComponent;
```

2. **Add to App.tsx**:
```typescript
import NewComponent from './components/NewComponent';

// Add to renderContent() function
case 'new-feature':
  return <NewComponent data={data} onAction={handleAction} />;
```

3. **Add Navigation** (in Layout.tsx):
```typescript
const menuItems = [
  // ... existing items
  { text: 'New Feature', icon: <NewIcon />, page: 'new-feature' },
];
```

#### Styling Guidelines

- Use Material-UI components for consistency
- Follow the established theme in `Layout.tsx`
- Use responsive design with breakpoints:
  - `xs`: 0-600px (mobile)
  - `sm`: 600-960px (tablet)
  - `md`: 960-1280px (desktop)
  - `lg`: 1280px+ (large desktop)

#### State Management

The application uses React hooks for state management:

```typescript
// Local state
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// API calls
const loadData = async () => {
  try {
    setLoading(true);
    const response = await api.getData();
    setData(response);
  } catch (err) {
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
};
```

## 🧪 Testing

### Backend Testing

```bash
cd backend/disbursement-service

# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=DisbursementCalculatorTests

# Run with coverage
mvn test jacoco:report
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### System Testing

```bash
cd docker

# Run comprehensive system test
./test-system.sh
```

## 🚀 Deployment

### Production Build

#### Backend
```bash
cd backend/disbursement-service
mvn clean package -Pprod
```

#### Frontend
```bash
cd frontend
npm run build
```

### Docker Deployment

```bash
# Build and run with Docker Compose
cd docker
./build.sh
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Environment Variables

#### Backend (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/loan_disbursement
    username: ${DB_USERNAME:loan_app}
    password: ${DB_PASSWORD:loan_password}
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
  
  jpa:
    hibernate:
      ddl-auto: ${DDL_AUTO:validate}
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_ENVIRONMENT=development
```

### Database Configuration

The system uses PostgreSQL with the following default settings:
- **Host:** localhost
- **Port:** 5432
- **Database:** loan_disbursement
- **Username:** loan_app
- **Password:** loan_password

### Redis Configuration

Redis is used for caching with default settings:
- **Host:** localhost
- **Port:** 6379
- **Cache Prefix:** loan-disbursement:

## 🐛 Troubleshooting

### Common Issues

#### Backend Won't Start
1. **Database Connection Error:**
   ```bash
   # Check if PostgreSQL is running
   docker ps | grep postgres
   
   # Check database logs
   docker logs loan-postgres
   ```

2. **Port Already in Use:**
   ```bash
   # Find process using port 8080
   lsof -i :8080
   
   # Kill process
   kill -9 <PID>
   ```

3. **Maven Plugin Issues:**
   ```bash
   # Clean and rebuild
   mvn clean install
   
   # Check Maven version
   mvn --version
   ```

#### Frontend Build Errors
1. **Node Modules Issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **TypeScript Errors:**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

#### Docker Issues
1. **Port Conflicts:**
   ```bash
   # Check what's using the port
   lsof -i :8082
   
   # Stop conflicting services
   docker-compose down
   
   # Restart with clean state
   docker-compose up -d
   ```

2. **Build Failures:**
   ```bash
   # Clean Docker cache
   docker system prune -a
   
   # Rebuild from scratch
   ./build.sh
   docker-compose up -d --build
   ```

#### Database Schema Issues
```sql
-- Check table structure
\d loans
\d loan_progress
\d loan_schedule

-- Fix missing columns if needed
ALTER TABLE loans ADD COLUMN customer_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Customer';
```

### Logs

#### Backend Logs
```bash
# View application logs
docker logs loan-disbursement-service
docker logs loan-data-ingestion-service
docker logs loan-forecasting-service

# View infrastructure logs
docker logs loan-postgres
docker logs loan-redis
```

#### Frontend Logs
```bash
# View frontend logs
docker logs loan-frontend

# Or check browser console (F12)
```

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://reactjs.org/docs/)
- [Material-UI Documentation](https://mui.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Run all tests: `mvn test` (backend) and `npm test` (frontend)
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 