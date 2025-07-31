# 🏦 Loan Disbursement System - Lightweight Version

A lightweight loan forecast and portfolio management system designed for American Plus Bank. This system provides loan disbursement predictions using a sigmoid model, real-time visualization, and comprehensive data analytics - all running entirely in the browser.

## ✨ Features

### 🎯 Core Capabilities
- **CSV Data Upload**: Upload loan data in CSV format directly in the browser
- **Forecast Dashboard**: Click any processed file to view a corresponding dedicated dashboard with analytics and charts
- **Disbursement Forecasting**: Realistic model for disbursement predictions using S-curve algorithm
- **Export Functionality**: Automatic download of forecast results after processing
- **Local Storage**: All data is stored locally in the browser

### 📊 Dashboard Metrics
- **Total Loans**: Count of loans
- **Total Loan Amount**: Sum of all loan principal amounts
- **Max Monthly Disbursement**: Peak projected outstanding balance
- **Data Points**: Total number of forecast data points generated

### 🔮 Forecasting Algorithm
- **Sigmoid Model**: S-curve disbursement prediction
- **Time-based Progress**: Considers project timeline and completion percentage
- **Extended Date Handling**: Accounts for loan extensions up to 6 months
- **Dynamic Cutoff**: Automatic zero-balance after extended date + 180 days

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**: For running the React application
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with localStorage support

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Dionysos599/Loan-Disbursement-System.git
   cd loan-disbursement-system
   git checkout feature/light_weight_system
   ```

2. **Install Dependencies**
   ```bash
   npm run install-deps
   ```

3. **Start the Application**
   ```bash
   npm start
   ```

4. **Access the Application**
   - **Frontend**: http://localhost:3000

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
   - **Automatic Download**: CSV file will be automatically downloaded when processing completes

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

### 3. View Dashboard

1. **Access Forecast Dashboard**
   - Click any row in the Processed Forecast table to open a dedicated dashboard for that file

2. **Portfolio Overview**
   - Loans count
   - Total loan amount (with two decimal places, in millions)
   - Max monthly disbursement (peak sum of all loans in any month, two decimal places, in millions)
   - Data points generated

3. **Interactive Charts**
   - Loan forecast timeline
   - Property type distribution
   - Outstanding balance trends

### 4. Export Forecast Data

1. **Automatic Download**
   - CSV file is automatically downloaded when processing completes successfully
   - Manual download is also available via the download button

2. **File Content**
   - Forecast loan data
   - Monthly forecast projections
   - Forecast start/end dates
   - Summary row with totals

### 5. Monitor Upload History

1. **View Past Uploads**
   - Check upload status (SUCCESS/FAILED/PROCESSING)
   - Review processing statistics
   - Access error logs if available

2. **Batch Management**
   - Each upload generates unique batch ID
   - Trace individual loan processing
   - Download or delete historical forecasts

## 🔧 Technical Architecture

### Frontend Technology Stack
- **React 19.1.0**: Modern React with hooks
- **TypeScript 4.9.5**: Type-safe development
- **Material-UI 7.2.0**: Modern UI components
- **Recharts**: Data visualization library
- **Day.js**: Date handling
- **Local Storage**: Browser-based data persistence

### Key Components
- **CSV Processor**: Handles file parsing and validation
- **Forecast Algorithm**: S-curve prediction model
- **Local Storage Service**: Manages data persistence
- **Dashboard Components**: Interactive visualizations

### Data Flow
1. **File Upload**: CSV file is read and parsed in the browser
2. **Data Validation**: Required columns and data types are validated
3. **Forecast Calculation**: S-curve algorithm processes each loan
4. **Result Generation**: Forecast data and CSV export are created
5. **Local Storage**: Results are saved to browser localStorage
6. **Auto Download**: CSV file is automatically downloaded

## 🔧 Development

### Local Development Environment

1. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm start
   # Frontend runs on http://localhost:3000
   ```

2. **Testing**
   ```bash
   cd frontend
   npm test
   ```

### Code Structure

```
loan-disbursement-system/
├── frontend/                      # React frontend application
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── DataUpload.tsx     # Main upload interface
│   │   │   ├── PortfolioDashboard.tsx # Dashboard visualization
│   │   │   └── DashboardModal.tsx # Modal wrapper
│   │   ├── services/              # Business logic services
│   │   │   ├── csvProcessor.ts    # CSV processing and forecasting
│   │   │   ├── localStorage.ts    # Local storage management
│   │   │   └── api.ts             # API service layer
│   │   ├── types/                 # TypeScript type definitions
│   │   └── utils/                 # Utility functions
│   ├── package.json               # Frontend dependencies
│   └── tsconfig.json              # TypeScript configuration
├── package.json                   # Root package.json
└── README.md                      # This file
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Static Hosting
The built application can be deployed to any static hosting service:
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your repository
- **GitHub Pages**: Deploy from the `build` folder
- **AWS S3**: Upload the `build` folder

### Environment Variables
No environment variables are required for the lightweight version.

## 🔧 Troubleshooting

### Common Issues

#### 1. File Upload Fails
**Symptoms**: Upload fails with processing error

**Solutions**:
- Verify CSV format matches requirements
- Check that all required columns are present
- Ensure proper CSV encoding (UTF-8)
- Remove empty rows/columns

#### 2. Browser Compatibility
**Symptoms**: Application doesn't work in older browsers

**Solutions**:
- Use modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Enable JavaScript
- Clear browser cache and cookies

#### 3. Local Storage Issues
**Symptoms**: Data disappears after browser restart

**Solutions**:
- Check if localStorage is enabled
- Clear browser data if storage is full
- Use private/incognito mode for testing

#### 4. Performance Issues
**Symptoms**: Slow processing of large files

**Solutions**:
- Process smaller CSV files (< 10MB) for better performance
- Close unnecessary browser tabs
- Use a modern computer with sufficient RAM

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

### Development Guidelines

1. **Code Standards**
   - Use TypeScript for type safety
   - Follow React functional component patterns
   - Implement proper error handling
   - Use Material-UI components consistently

2. **Testing**
   - Write unit tests for utility functions
   - Test CSV processing logic
   - Verify forecast algorithm accuracy

3. **Performance**
   - Optimize for large CSV files
   - Minimize bundle size
   - Use efficient data structures

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For questions or support, please open an issue in the project repository or contact the development team. 