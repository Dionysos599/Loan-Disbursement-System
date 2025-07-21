import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// API imports
import { loanForecastAPI } from '../services/api';

// Type imports
import { LoanForecastData } from '../types/loan';

interface ForecastVisualizationProps {
  forecastData: LoanForecastData[] | null;
  onForecastDataLoaded?: (data: LoanForecastData[]) => void;
}

const ForecastVisualization: React.FC<ForecastVisualizationProps> = ({ 
  forecastData, 
  onForecastDataLoaded 
}) => {
  const [selectedLoan, setSelectedLoan] = useState<string>('all');
  const [localForecastData, setLocalForecastData] = useState<LoanForecastData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load latest forecast data if none provided
  useEffect(() => {
    if (!forecastData) {
      loadLatestForecastData();
    }
  }, [forecastData]);

  const loadLatestForecastData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const latestUpload = await loanForecastAPI.getLatestSuccessfulUpload();
      if (latestUpload) {
        const forecastDataList = await loanForecastAPI.getForecastData(latestUpload.batchId);
        
        // Convert to frontend expected format
        const convertedData = forecastDataList.map((loan: any) => ({
          ...loan,
          scenarioName: loan.loanNumber || 'N/A',
        }));
        
        setLocalForecastData(convertedData);
        
        // Notify parent component
        if (onForecastDataLoaded) {
          onForecastDataLoaded(convertedData);
        }
      } else {
        setError('No forecast data available. Please upload data first.');
      }
    } catch (error) {
      console.error('Error loading forecast data:', error);
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  // Use provided data or local data
  const currentForecastData = forecastData || localForecastData;

  // Get unique scenarios (loan numbers)
  const uniqueLoans = useMemo(() => {
    if (!currentForecastData) return [];
    return Array.from(new Set(currentForecastData.map((loan: any) => loan.loanNumber || loan.scenarioName))).filter(Boolean) as string[];
  }, [currentForecastData]);

  // Filter data based on selected loan
  const filteredData = useMemo(() => {
    if (!currentForecastData) return [];
    if (selectedLoan === 'all') return currentForecastData;
    return currentForecastData.filter((loan: any) => 
      (loan.loanNumber || loan.scenarioName) === selectedLoan
    );
  }, [currentForecastData, selectedLoan]);

  // Prepare loan comparison data
  const loanComparisonData = useMemo(() => {
    if (!currentForecastData) return [];
    
    const loanTotals = currentForecastData.reduce((acc: Record<string, number>, loan: any) => {
      const loanId = loan.loanNumber || loan.scenarioName || 'Unknown';
      const totalAmount = loan.totalForecastedAmount || 
        Object.values(loan.forecastData || {}).reduce((sum: number, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
      acc[loanId] = totalAmount;
      return acc;
    }, {});

    return Object.entries(loanTotals).map(([loanId, total]) => ({
      loan: loanId,
      totalAmount: total,
    }));
  }, [currentForecastData]);

  // Prepare chart data with proper date sorting
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];

    const dateAmountMap: Record<string, number> = {};
    
    filteredData.forEach((loan: any) => {
      if (loan.forecastData) {
        Object.entries(loan.forecastData).forEach(([date, amount]) => {
          const numericAmount = typeof amount === 'number' ? amount : 0;
          dateAmountMap[date] = (dateAmountMap[date] || 0) + numericAmount;
        });
      }
    });

    // 按照实际日期顺序排序，而不是字符串排序
    const sortedDates = Object.keys(dateAmountMap).sort((a, b) => {
      // 将 "Nov-24" 格式转换为可比较的日期
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
  }, [filteredData]);

  // Prepare chart data for different chart types
  const lineChartData = chartData.map(item => ({ ...item, type: 'line' as const }));
  const barChartData = chartData.map(item => ({ ...item, type: 'bar' as const }));

  // Prepare detailed table data
  const tableData = useMemo(() => {
    if (!filteredData.length) return [];

    const rows: any[] = [];
    filteredData.forEach((loan: any) => {
      const loanNumber = loan.loanNumber || loan.scenarioName || 'Unknown';
      if (loan.forecastData) {
        Object.entries(loan.forecastData).forEach(([date, amount]) => {
          rows.push({
            loanNumber,
            date,
            amount: typeof amount === 'number' ? amount : 0,
            scenarioName: loanNumber,
          });
        });
      }
    });

    return rows.sort((a, b) => {
      // Sort by loan number first, then by date
      if (a.loanNumber !== b.loanNumber) {
        return a.loanNumber.localeCompare(b.loanNumber);
      }
      
      // Parse and compare dates
      const parseDate = (dateStr: string) => {
        const [month, year] = dateStr.split('-');
        const monthMap: Record<string, number> = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year);
        return new Date(fullYear, monthMap[month], 1);
      };

      return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });
  }, [filteredData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading forecast data...</Typography>
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

  if (!currentForecastData || currentForecastData.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 3 }}>
        No forecast data available. Please upload data first.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Loan Forecast Visualization
      </Typography>

      {/* Loan Selection */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth sx={{ maxWidth: 300 }}>
          <InputLabel>Loan</InputLabel>
          <Select
            value={selectedLoan}
            label="Loan"
            onChange={(e) => setSelectedLoan(e.target.value)}
          >
            <MenuItem value="all">All Loans</MenuItem>
            {uniqueLoans.map((loan) => (
              <MenuItem key={loan} value={loan}>
                Loan: {loan}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Charts */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Forecast Timeline
        </Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']} />
            <Legend />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Loan Comparison Chart */}
      {selectedLoan === 'all' && loanComparisonData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Loan Comparison
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={loanComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="loan" />
              <YAxis />
              <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Total Amount']} />
              <Legend />
              <Bar dataKey="totalAmount" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Detailed Data Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Forecast Data Details
        </Typography>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Loan Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Forecasted Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={`${row.loanNumber}-${row.date}-${index}`}>
                  <TableCell>
                    <Chip 
                      label={`Loan: ${row.loanNumber}`} 
                      variant="outlined" 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">
                    ${row.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ForecastVisualization; 