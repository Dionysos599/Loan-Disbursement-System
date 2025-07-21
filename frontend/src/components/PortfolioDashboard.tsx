import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Divider,
  CircularProgress
} from '@mui/material';
import { TrendingUp, AccountBalance, Group, Today, Refresh, ShowChart } from '@mui/icons-material';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dataIngestionAPI } from '../services/api';

interface PortfolioDashboardProps {
  forecastData?: any;
}

interface UploadHistory {
  id: number;
  batchId: string;
  originalFilename: string;
  totalRecords: number;
  processedRecords: number;
  uploadedAt: string;
  forecastStartDate: string;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ forecastData }) => {
  const [latestUpload, setLatestUpload] = useState<UploadHistory | null>(null);
  const [latestForecastData, setLatestForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load latest successful upload
  const loadLatestUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const upload = await dataIngestionAPI.getLatestSuccessfulUpload();
      setLatestUpload(upload);
      
      // If there is latest upload and no forecastData, try to load forecast data
      if (upload && !forecastData) {
        try {
          const forecastData = await dataIngestionAPI.getForecastData(upload.batchId);
          setLatestForecastData(forecastData);
        } catch (error) {
          console.warn('Failed to load forecast data:', error);
          // No error is set, because this is not a critical error
        }
      }
    } catch (error) {
      console.error('Failed to load latest upload:', error);
      setError('Failed to load latest upload data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestUpload();
  }, [forecastData]);

  // Calculate statistics data
  const displayData = forecastData || latestForecastData;
  const statsData = React.useMemo(() => {
    if (!displayData) {
      return {
        totalLoanAmount: 0,
        totalCustomers: 0,
        averageCompletion: 0,
        totalForecastedAmount: 0
      };
    }

    if (displayData.summary) {
      return {
        totalLoanAmount: displayData.summary.totalLoanAmount || 0,
        totalCustomers: displayData.summary.totalLoans || 0,
        averageCompletion: 0, // TODO: calculate average completion
        totalForecastedAmount: displayData.summary.totalForecastedAmount || 0
      };
    }

    // If the data is returned from upload, calculate statistics
    if (displayData.loanForecasts) {
      const totalAmount = displayData.loanForecasts.reduce((sum: number, loan: any) => 
        sum + (loan.loanAmount || 0), 0);
      const totalForecasted = displayData.loanForecasts.reduce((sum: number, loan: any) => 
        sum + (loan.totalForecastedAmount || 0), 0);
      
      return {
        totalLoanAmount: totalAmount,
        totalCustomers: displayData.loanForecasts.length,
        averageCompletion: 0, // TODO: calculate average completion
        totalForecastedAmount: totalForecasted
      };
    }

    return {
      totalLoanAmount: 0,
      totalCustomers: 0,
      averageCompletion: 0,
      totalForecastedAmount: 0
    };
  }, [displayData]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!displayData) return [];

    // If the data is from forecastData
    if (displayData.forecastData && Array.isArray(displayData.forecastData)) {
      const monthlyData = displayData.forecastData.reduce((acc: any, item: any) => {
        const month = item.date;
        if (!acc[month]) {
          acc[month] = { month, totalAmount: 0, count: 0 };
        }
        acc[month].totalAmount += item.cumulativeAmount || 0;
        acc[month].count += 1;
        return acc;
      }, {});

      return Object.values(monthlyData).slice(0, 12); // Only show the first 12 months
    }

    // If the data is from loanForecasts
    if (displayData.loanForecasts && Array.isArray(displayData.loanForecasts)) {
      const monthlyData: { [key: string]: { month: string; totalAmount: number } } = {};
      
      displayData.loanForecasts.forEach((loan: any) => {
        if (loan.forecastData) {
          Object.entries(loan.forecastData).forEach(([date, amount]: [string, any]) => {
            const month = dayjs(date).format('YYYY-MM');
            if (!monthlyData[month]) {
              monthlyData[month] = { month, totalAmount: 0 };
            }
            monthlyData[month].totalAmount += Number(amount) || 0;
          });
        }
      });

      return Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(0, 12)
        .map(item => ({
          ...item,
          month: dayjs(item.month).format('MMM YYYY')
        }));
    }

    return [];
  }, [displayData]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Portfolio Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadLatestUpload}
          disabled={loading}
        >
          Refresh data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!displayData && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No forecast data. Please upload CSV file to generate forecast data.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {latestUpload && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ShowChart sx={{ mr: 1 }} />
              Latest forecast data
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">File name</Typography>
                <Typography variant="body1">{latestUpload.originalFilename}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Upload time</Typography>
                <Typography variant="body1">{dayjs(latestUpload.uploadedAt).format('YYYY-MM-DD HH:mm')}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Processed records</Typography>
                <Typography variant="body1">{latestUpload.processedRecords}/{latestUpload.totalRecords}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Key metrics cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Today color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="primary">
                    {dayjs().format('YYYY-MM-DD')}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today's date
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="secondary">
                    ${statsData.totalLoanAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total loan amount
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Group color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="info.main">
                    {statsData.totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total customers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="success.main">
                    {statsData.averageCompletion.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average completion
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Forecast trend chart */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              Forecast trend
            </Typography>
            <Box sx={{ height: 400, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => `$${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="totalAmount" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Cumulative forecast amount"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Total forecast amount card */}
      {statsData.totalForecastedAmount > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Forecast overview
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Total forecast amount</Typography>
                <Typography variant="h5" color="primary">
                  ${statsData.totalForecastedAmount.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Forecast start date</Typography>
                <Typography variant="h6">
                  {displayData?.forecastStartDate ? dayjs(displayData.forecastStartDate).format('YYYY-MM') : '-'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PortfolioDashboard; 