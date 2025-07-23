import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';

import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  DataUsage as DataUsageIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

import { loanForecastAPI } from '../services/api';

import { LoanForecastData } from '../types/loan';

const PortfolioDashboard: React.FC = () => {
  const theme = useTheme();
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<LoanForecastData[] | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<string>('all');
  const [dataSource, setDataSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get latest upload and forecast data
      const upload = await loanForecastAPI.getLatestSuccessfulUpload();
      if (!upload) {
        setError('No data available. Please upload loan data first.');
        return;
      }

      // Set data source filename
      setDataSource(upload.originalFilename);

      const forecastDataList = await loanForecastAPI.getForecastData(upload.batchId);
      
      // Process data for portfolio analysis
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
    
    // Find the highest forecasted balance
    const highestForecastedBalance = forecastData.reduce((max, loan) => {
      const loanMax = loan.forecastData ? Math.max(...Object.values(loan.forecastData).filter(val => typeof val === 'number')) : 0;
      return Math.max(max, loanMax);
    }, 0);

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
      .slice(0, 5)
      .map(([city, amount]) => ({
        name: city,
        value: amount,
        percentage: totalForecastAmount > 0 ? ((amount / totalForecastAmount) * 100).toFixed(1) : '0',
      }));

    return {
      summary: {
        totalLoans,
        totalLoanAmount,
        highestForecastedBalance,
        totalDataPoints,
      },
      propertyTypeData,
      cityData,
    };
  };

  // Get unique scenarios (loan numbers)
  const uniqueLoans = useMemo(() => {
    if (!forecastData) return [];
    return Array.from(new Set(forecastData.map((loan: any) => loan.loanNumber || loan.scenarioName))).filter(Boolean) as string[];
  }, [forecastData]);

  // Filter data based on selected loan
  const filteredForecastData = useMemo(() => {
    if (!forecastData) return [];
    if (selectedLoan === 'all') return forecastData;
    return forecastData.filter((loan: any) => 
      (loan.loanNumber || loan.scenarioName) === selectedLoan
    );
  }, [forecastData, selectedLoan]);

  // Prepare forecast chart data
  const forecastChartData = useMemo(() => {
    if (!filteredForecastData.length) return [];

    const dateAmountMap: Record<string, number> = {};
    
    filteredForecastData.forEach((loan: any) => {
      if (loan.forecastData) {
        Object.entries(loan.forecastData).forEach(([date, amount]) => {
          const numericAmount = typeof amount === 'number' ? amount : 0;
          dateAmountMap[date] = (dateAmountMap[date] || 0) + numericAmount;
        });
      }
    });

    // Sort dates properly
    const sortedDates = Object.keys(dateAmountMap).sort((a, b) => {
      const parseDate = (dateStr: string) => {
        const [month, year] = dateStr.split('-');
        const monthMap: Record<string, number> = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        return new Date(fullYear, monthMap[month], 1);
      };

      return parseDate(a).getTime() - parseDate(b).getTime();
    });

    return sortedDates.map(date => ({
      date,
      amount: dateAmountMap[date],
    }));
  }, [filteredForecastData]);

  // Prepare loan comparison data
  const loanComparisonData = useMemo(() => {
    if (!forecastData) return [];
    
    const loanTotals = forecastData.reduce((acc: Record<string, number>, loan: any) => {
      const loanId = loan.loanNumber || loan.scenarioName || 'Unknown';
      const totalAmount = loan.totalForecastedAmount || 
        Object.values(loan.forecastData || {}).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
      acc[loanId] = totalAmount;
      return acc;
    }, {});

    return Object.entries(loanTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([loanId, total]) => ({
        loan: loanId.length > 10 ? `${loanId.substring(0, 10)}...` : loanId,
        fullLoan: loanId,
        totalAmount: total,
      }));
  }, [forecastData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading dashboard data...</Typography>
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

  if (!portfolioData || !forecastData) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
        No data available. Please upload loan data first.
      </Alert>
    );
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
          </Box>
          <Box sx={{ 
            width: 60,
            height: 60,
            borderRadius: '50%', 
            backgroundColor: alpha(color, 0.1),
            border: `2px solid ${alpha(color, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: theme.palette.primary.main }}>
          Loan Portfolio Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive overview of your loan portfolio and forecasting analytics
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Total loans"
            value={portfolioData.summary.totalLoans.toLocaleString()}
            icon={<AccountBalanceIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Total loan amount"
            value={`$${(portfolioData.summary.totalLoanAmount / 1000000).toFixed(1)}M`}
            icon={<AttachMoneyIcon sx={{ fontSize: 32, color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Highest forecasted balance"
            value={`$${(portfolioData.summary.highestForecastedBalance / 1000).toFixed(0)}K`}
            icon={<TrendingUpIcon sx={{ fontSize: 32, color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Data points"
            value={portfolioData.summary.totalDataPoints.toLocaleString()}
            icon={<DataUsageIcon sx={{ fontSize: 32, color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
          />
        </Box>
      </Box>

      {/* Forecast Section */}
      <Paper sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'left' }}>
              Loan Forecast Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
              Interactive forecast visualization with loan-specific filtering
            </Typography>
          </Box>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Loan</InputLabel>
            <Select
              value={selectedLoan}
              label="Select Loan"
              onChange={(e) => setSelectedLoan(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease-in-out',
                }
              }}
            >
              <MenuItem value="all">All Loans</MenuItem>
              {uniqueLoans.map((loan) => (
                <MenuItem key={loan} value={loan}>
                  {loan}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={forecastChartData}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
            <XAxis 
              dataKey="date" 
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip 
              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Forecasted Amount']}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              fill="url(#colorAmount)"
              animationDuration={200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      {/* Data Source Info */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 1000 
      }}>
        <Chip
          label={`Data Source: ${dataSource}`}
          variant="outlined"
          size="small"
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
          }}
        />
      </Box>
    </Box>
  );
};

export default PortfolioDashboard; 