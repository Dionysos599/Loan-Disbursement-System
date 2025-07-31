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

    // Group by loan number (since we don't have property type)
    const byLoanNumber = forecastData.reduce((acc: Record<string, number>, loan) => {
      const loanId = loan.loanNumber || 'Unknown';
      acc[loanId] = (acc[loanId] || 0) + (loan.totalForecastedAmount || 0);
      return acc;
    }, {});

    const loanNumberData = Object.entries(byLoanNumber)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([loanId, amount]) => ({
        name: loanId,
        value: amount,
        percentage: totalForecastAmount > 0 ? ((amount / totalForecastAmount) * 100).toFixed(1) : '0',
      }));

    return {
      summary: {
        totalLoans,
        totalLoanAmount,
        maxLoanForecast,
        totalDataPoints,
      },
      propertyTypeData: loanNumberData, // 重命名为propertyTypeData以保持兼容性
      cityData: loanNumberData, // 重命名为cityData以保持兼容性
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

  const StatCard = ({ title, value, icon, color, bgColor }: any) => (
    <Card 
      sx={{ 
        height: '72px',
        background: bgColor || '#f8fafd',
        border: '1px solid #e3e8ee',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 2,
        py: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5, fontSize: 15 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color, lineHeight: 1.1, fontSize: 28 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{
          width: 34,
          height: 34,
          minWidth: 34,
          minHeight: 34,
          maxWidth: 34,
          maxHeight: 34,
          borderRadius: '50%',
          background: color + '10',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ml: 2,
          border: `2px solid ${color}22`,
          boxSizing: 'border-box',
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
        </Box>
      </Box>
    </Card>
  );

  return (
    <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#15418C', mb: 2 }}>
          Forecast Dashboard: {
            dataSource
              ? (dataSource.length > 20 && dataSource.endsWith('.csv')
                  ? `${dataSource.slice(0, 19)}...`
                  : dataSource)
              : batchId
          }
        </Typography>
        <Typography variant="body1" sx={{ color: '#15418C', fontSize: 20, mb: 2 }}>
          Comprehensive overview of your loan portfolio and forecasting analytics
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Total loans"
            value={portfolioData.summary.totalLoans.toLocaleString()}
            icon={<AccountBalanceIcon />}
            color="#1976d2"
            bgColor="#f3f7fb"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Total loan amount"
            value={`$${(portfolioData.summary.totalLoanAmount / 1000000).toFixed(2)}M`}
            icon={<AttachMoneyIcon />}
            color="#388e3c"
            bgColor="#f3faf4"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Max montly disbursement"
            value={`$${(portfolioData.summary.maxLoanForecast / 1000000).toFixed(2)}M`}
            icon={<TrendingUpIcon />}
            color="#f57c00"
            bgColor="#fff7f0"
          />
        </Box>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <StatCard
            title="Data points"
            value={portfolioData.summary.totalDataPoints.toLocaleString()}
            icon={<DataUsageIcon />}
            color="#1976d2"
            bgColor="#f3f7fb"
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
    </Box>
  );
};

export default PortfolioDashboard; 