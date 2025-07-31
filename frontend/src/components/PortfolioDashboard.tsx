import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';

import { Close as CloseIcon } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { loanForecastAPI } from '../services/api';
import { localStorageService } from '../services/localStorage';
import { LoanForecastData } from '../types/loan';

interface PortfolioDashboardProps {
  batchId: string;
  open: boolean;
  onClose: () => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ batchId, open, onClose }) => {
  const theme = useTheme();
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<LoanForecastData[] | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<string>('all');
  const [dataSource, setDataSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && batchId) {
      loadDashboardData();
    }
  }, [open, batchId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let upload: any;
      if (batchId) {
        const history = localStorageService.getUploadHistory();
        upload = history.find((item) => item.batchId === batchId);
      } else {
        upload = localStorageService.getLatestSuccessfulUpload();
      }
      
      if (!upload) {
        setError('No data available. Please upload loan data first.');
        return;
      }
      
      // Set data source filename
      if (upload.originalFilename) setDataSource(upload.originalFilename);
      else setDataSource('');
      
      let forecastDataList = localStorageService.getForecastData(upload.batchId);
      
             // only keep the forecast data for the current batch
       if (Array.isArray(forecastDataList)) {
         forecastDataList = forecastDataList.filter(item => item); // Remove filter since batchId doesn't exist in LoanForecastData
       }
      
      const processedData = processPortfolioData(forecastDataList);
      setPortfolioData(processedData);
      setForecastData(forecastDataList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processPortfolioData = (forecastData: LoanForecastData[]) => {
    const totalLoans = forecastData.length;
    const totalLoanAmount = forecastData.reduce((sum, loan) => 
      sum + (loan.loanAmount || 0), 0
    );
    const totalForecastAmount = forecastData.reduce((sum, loan) => 
      sum + (loan.totalForecastedAmount || 0), 0
    );

    const monthSum: Record<string, number> = {};
    forecastData.forEach(loan => {
      if (loan.forecastData) {
        Object.entries(loan.forecastData).forEach(([month, value]) => {
          if (typeof value === 'number') {
            monthSum[month] = (monthSum[month] || 0) + value;
          }
        });
      }
    });
    const maxLoanForecast = Object.values(monthSum).reduce((max, sum) => Math.max(max, sum), 0);

    // Count total data points (forecast entries)
    const totalDataPoints = forecastData.reduce((total, loan) => {
      return total + (loan.forecastData ? Object.keys(loan.forecastData).length : 0);
    }, 0);

    // Group by property type
    const byPropertyType = forecastData.reduce((acc: Record<string, number>, loan) => {
      const type = loan.propertyType || 'Unknown';
      acc[type] = (acc[type] || 0) + (loan.totalForecastedAmount || 0);
      return acc;
    }, {});

    const propertyTypeData = Object.entries(byPropertyType).map(([type, amount]) => ({
      name: type,
      value: amount,
      percentage: totalForecastAmount > 0 ? ((amount / totalForecastAmount) * 100).toFixed(1) : '0',
    }));

    // Group by city
    const byCity = forecastData.reduce((acc: Record<string, number>, loan) => {
      const city = loan.city || 'Unknown';
      acc[city] = (acc[city] || 0) + (loan.totalForecastedAmount || 0);
      return acc;
    }, {});

    const cityData = Object.entries(byCity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city, amount]) => ({
        name: city,
        value: amount,
        percentage: totalForecastAmount > 0 ? ((amount / totalForecastAmount) * 100).toFixed(1) : '0',
      }));

    // Prepare timeline data
    const timelineData = Object.entries(monthSum)
      .sort(([a], [b]) => {
        const dateA = new Date(`01-${a}`);
        const dateB = new Date(`01-${b}`);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([month, amount]) => ({
        month,
        amount: amount / 1000000, // Convert to millions
      }));

    return {
      totalLoans,
      totalLoanAmount: totalLoanAmount / 1000000, // Convert to millions
      maxLoanForecast: maxLoanForecast / 1000000, // Convert to millions
      totalDataPoints,
      propertyTypeData,
      cityData,
      timelineData,
    };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1'];

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
        <DialogContent>
          <Alert severity="error">{error}</Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Portfolio Dashboard</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        {dataSource && (
          <Typography variant="body2" color="text.secondary">
            Data Source: {dataSource}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {portfolioData && (
          <Box>
            {/* Key Metrics */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
              <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Loans
                  </Typography>
                  <Typography variant="h4">
                    {portfolioData.totalLoans.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Loan Amount
                  </Typography>
                  <Typography variant="h4">
                    ${portfolioData.totalLoanAmount.toFixed(2)}M
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Max Monthly Disbursement
                  </Typography>
                  <Typography variant="h4">
                    ${portfolioData.maxLoanForecast.toFixed(2)}M
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Data Points
                  </Typography>
                  <Typography variant="h4">
                    {portfolioData.totalDataPoints.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Charts */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Timeline Chart */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Forecast Timeline
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={portfolioData.timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}M`, 'Amount']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Property Type Distribution */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Property Type Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={portfolioData.propertyTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioData.propertyTypeData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${(value as number / 1000000).toFixed(2)}M`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* City Distribution */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Cities by Forecast Amount
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={portfolioData.cityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(value as number / 1000000).toFixed(2)}M`, 'Amount']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={theme.palette.secondary.main} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioDashboard; 