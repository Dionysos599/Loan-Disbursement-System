import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// API imports
import { loanForecastAPI } from '../services/api';

// Type imports
import { LoanForecastData } from '../types/loan';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PortfolioDashboard: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get latest upload and forecast data
      const upload = await loanForecastAPI.getLatestSuccessfulUpload();
      if (!upload) {
        setError('No data available. Please upload loan data first.');
        return;
      }

      const forecastData = await loanForecastAPI.getForecastData(upload.batchId);
      
      // Process data for portfolio analysis
      const processedData = processPortfolioData(forecastData);
      setPortfolioData(processedData);

    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const processPortfolioData = (forecastData: LoanForecastData[]) => {
    const totalLoans = forecastData.length;
    const totalAmount = forecastData.reduce((sum, loan) => 
      sum + (loan.totalForecastedAmount || 0), 0
    );

    // Group by property type
    const byPropertyType = forecastData.reduce((acc: Record<string, number>, loan) => {
      const type = loan.propertyType || 'Unknown';
      acc[type] = (acc[type] || 0) + (loan.totalForecastedAmount || 0);
      return acc;
    }, {});

    const propertyTypeData = Object.entries(byPropertyType).map(([type, amount]) => ({
      name: type,
      value: amount,
      percentage: ((amount / totalAmount) * 100).toFixed(1),
    }));

    // Group by city
    const byCity = forecastData.reduce((acc: Record<string, number>, loan) => {
      const city = loan.city || 'Unknown';
      acc[city] = (acc[city] || 0) + (loan.totalForecastedAmount || 0);
      return acc;
    }, {});

    const cityData = Object.entries(byCity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([city, amount]) => ({
        name: city,
        value: amount,
        percentage: ((amount / totalAmount) * 100).toFixed(1),
      }));

    return {
      summary: {
        totalLoans,
        totalAmount,
        averageLoanAmount: totalAmount / totalLoans,
      },
      propertyTypeData,
      cityData,
    };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading portfolio data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!portfolioData) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
        No portfolio data available.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Loan Portfolio Dashboard
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Loans
              </Typography>
              <Typography variant="h4">
                {portfolioData.summary.totalLoans}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Portfolio Value
              </Typography>
              <Typography variant="h4">
                ${portfolioData.summary.totalAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Average Loan Amount
              </Typography>
              <Typography variant="h4">
                ${portfolioData.summary.averageLoanAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Charts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribution by Property Type
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
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
        
        <Box sx={{ flex: '1 1 400px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top 5 Cities by Portfolio Value
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={portfolioData.cityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {portfolioData.cityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default PortfolioDashboard; 