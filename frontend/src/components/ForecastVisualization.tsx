import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { TrendingUp, Analytics, Timeline } from '@mui/icons-material';
import dayjs from 'dayjs';
import { dataIngestionAPI } from '../services/api';

interface ForecastData {
  loanNumber: string;
  date: string;
  cumulativeAmount: number;
  monthlyAmount: number;
  percentComplete: number;
  forecastType: string;
  scenarioName: string;
  confidenceLevel: number;
}

interface ForecastVisualizationProps {
  forecastData: {
    forecastId: string;
    batchId: string;
    status: string;
    generatedAt: string;
    forecastStartDate: string;
    forecastEndDate: string;
    forecastModel: string;
    forecastData: ForecastData[];
    summary: any;
    message: string;
  } | null;
  onForecastDataLoaded?: (data: any) => void;
}

const ForecastVisualization: React.FC<ForecastVisualizationProps> = ({ forecastData, onForecastDataLoaded }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [chartType, setChartType] = useState<'cumulative' | 'monthly'>('cumulative');
  const [loading, setLoading] = useState(false);
  const [localForecastData, setLocalForecastData] = useState<any>(forecastData);

  // Auto-load latest forecast data if not provided
  useEffect(() => {
    const loadLatestForecastData = async () => {
      if (!localForecastData && !loading) {
        setLoading(true);
        try {
          const latestUpload = await dataIngestionAPI.getLatestSuccessfulUpload();
          if (latestUpload) {
            const forecastDataList = await dataIngestionAPI.getForecastData(latestUpload.batchId);
            if (forecastDataList && forecastDataList.length > 0) {
              // Convert backend data to frontend format
              const convertedData = {
                forecastId: latestUpload.batchId,
                batchId: latestUpload.batchId,
                status: 'COMPLETED',
                generatedAt: latestUpload.processedAt || latestUpload.uploadedAt,
                forecastStartDate: latestUpload.forecastStartDate,
                forecastEndDate: new Date(new Date(latestUpload.forecastStartDate).getTime() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                forecastModel: 'S-curve',
                forecastData: forecastDataList.flatMap((loan: any) => 
                  Object.entries(loan.forecastData || {}).map(([date, amount]) => ({
                    loanNumber: loan.loanNumber || 'N/A',
                    date: date,
                    cumulativeAmount: Number(amount),
                    monthlyAmount: Number(amount),
                    percentComplete: 0,
                    forecastType: 'S-curve',
                    scenarioName: loan.loanNumber || 'Unknown',
                    confidenceLevel: 0.85,
                  }))
                ),
                summary: {
                  totalLoans: forecastDataList.length,
                  totalForecastedAmount: forecastDataList.reduce((sum: number, loan: any) => sum + (loan.totalForecastedAmount || 0), 0)
                },
                message: `Loaded ${forecastDataList.length} loan forecasts`
              };
              setLocalForecastData(convertedData);
              if (onForecastDataLoaded) {
                onForecastDataLoaded(convertedData);
              }
            }
          }
        } catch (error) {
          console.error('Failed to load latest forecast data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadLatestForecastData();
  }, []); // 移除依赖，只在组件首次加载时执行

  // Update local data when prop changes
  useEffect(() => {
    if (forecastData) {
      setLocalForecastData(forecastData);
    }
  }, [forecastData]);

  // Use localForecastData instead of forecastData for the rest of the component
  const displayData = localForecastData;

  // Get unique scenarios
  const scenarios = useMemo(() => {
    if (!displayData || !displayData.forecastData) return [];
    const scenarioNames = displayData.forecastData.map((d: any) => d.scenarioName);
    const uniqueScenarios = Array.from(new Set(scenarioNames)) as string[];
    return uniqueScenarios;
  }, [displayData]);

  // Filter data based on selected scenario
  const filteredData = useMemo(() => {
    if (!displayData || !displayData.forecastData) return [];
    if (selectedScenario === 'all') {
      return displayData.forecastData;
    }
    return displayData.forecastData.filter((d: any) => d.scenarioName === selectedScenario);
  }, [displayData, selectedScenario]);

  // Prepare chart data for line chart
  const lineChartData = useMemo(() => {
    if (!filteredData.length) return { xAxis: [], series: [] };
    
    const groupedByDate = filteredData.reduce((acc: Record<string, number>, item: any) => {
      if (!acc[item.date]) {
        acc[item.date] = 0;
      }
      acc[item.date] += item.cumulativeAmount;
      return acc;
    }, {});

    // 按照实际日期顺序排序，而不是字符串排序
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
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
    
    const values = sortedDates.map(date => groupedByDate[date]);

    return {
      xAxis: sortedDates,
      series: [{
        name: 'Cumulative Amount',
        data: values,
        color: '#1976d2',
      }],
    };
  }, [filteredData]);

  // Prepare chart data for bar chart
  const barChartData = useMemo(() => {
    if (!filteredData.length) return { xAxis: [], series: [] };
    
    const groupedByDate = filteredData.reduce((acc: Record<string, number>, item: any) => {
      if (!acc[item.date]) {
        acc[item.date] = 0;
      }
      acc[item.date] += item.monthlyAmount;
      return acc;
    }, {});

    // 按照实际日期顺序排序，而不是字符串排序
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
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
    
    const values = sortedDates.map(date => groupedByDate[date]);

    return {
      xAxis: sortedDates,
      series: [{
        name: 'Monthly Amount',
        data: values,
        color: '#2e7d32',
      }],
    };
  }, [filteredData]);

  const loanComparisonData = useMemo(() => {
    if (!displayData || !displayData.forecastData || !scenarios.length) return [];
    
    const loanData = scenarios.map((loanNumber: string) => {
      const loanItems = displayData.forecastData.filter((d: any) => d.scenarioName === loanNumber);
      const maxCumulative = Math.max(...loanItems.map((d: any) => d.cumulativeAmount));
      const avgMonthly = loanItems.reduce((sum: number, d: any) => sum + d.monthlyAmount, 0) / loanItems.length;
      
      return {
        loanNumber,
        maxCumulative,
        avgMonthly,
        totalItems: loanItems.length,
      };
    });

    return loanData;
  }, [displayData, scenarios]);

  // Show loading or no data message
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading latest forecast data...</Typography>
      </Box>
    );
  }

  if (!displayData || !displayData.forecastData || displayData.forecastData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No forecast data available. Please upload data first.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Disbursement Forecast
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Forecast ID: {displayData.forecastId} | Model: {displayData.forecastModel}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Chip 
                label={displayData.status} 
                color={displayData.status === 'COMPLETED' ? 'success' : 'warning'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                Generated: {dayjs(displayData.generatedAt).format('MMM DD, YYYY HH:mm')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, alignItems: 'center' }}>
            <FormControl fullWidth>
              <InputLabel>Loan</InputLabel>
              <Select
                value={selectedScenario}
                label="Loan"
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                <MenuItem value="all">All Loans</MenuItem>
                {scenarios.map((scenario) => (
                  <MenuItem key={scenario} value={scenario}>
                    Loan: {scenario}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as 'cumulative' | 'monthly')}
              >
                <MenuItem value="cumulative">Cumulative Amount</MenuItem>
                <MenuItem value="monthly">Monthly Amount</MenuItem>
              </Select>
            </FormControl>
            <Box textAlign="right">
              <Typography variant="body2" color="textSecondary">
                {filteredData.length} data points
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Main Chart */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
              {chartType === 'cumulative' ? 'Cumulative Disbursement Forecast' : 'Monthly Disbursement Forecast'}
            </Typography>
            
            {chartType === 'cumulative' ? (
              <LineChart
                xAxis={[{ data: lineChartData.xAxis, scaleType: 'band' }]}
                series={lineChartData.series}
                height={400}
              />
            ) : (
              <BarChart
                xAxis={[{ data: barChartData.xAxis, scaleType: 'band' }]}
                series={barChartData.series}
                height={400}
              />
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Forecast Summary
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Total Forecasted Amount</Typography>
              <Typography variant="h6">
                ${Math.max(...lineChartData.series[0].data).toLocaleString()}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Average Monthly Disbursement</Typography>
              <Typography variant="h6">
                ${(barChartData.series[0].data.reduce((sum: number, d: number) => sum + d, 0) / barChartData.xAxis.length).toLocaleString()}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Peak Month</Typography>
              <Typography variant="h6">
                {barChartData.xAxis[barChartData.series[0].data.indexOf(Math.max(...barChartData.series[0].data))]}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">Forecast Period</Typography>
              <Typography variant="h6">
                {dayjs(displayData.forecastStartDate).format('MMM YYYY')} - {dayjs(displayData.forecastEndDate).format('MMM YYYY')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Scenario Comparison */}
      {scenarios.length > 1 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scenario Comparison
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Scenario</TableCell>
                    <TableCell align="right">Max Cumulative ($)</TableCell>
                    <TableCell align="right">Avg Monthly ($)</TableCell>
                    <TableCell align="right">Confidence Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loanComparisonData.map((row: any, index: number) => (
                    <TableRow key={row.loanNumber || index}>
                      <TableCell>
                        <Chip 
                          label={`Loan: ${row.loanNumber}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        ${row.maxCumulative.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${row.avgMonthly.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {(row.totalItems * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Data Table */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Forecast Data Details
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Loan Number</TableCell>
                  <TableCell align="right">Cumulative Amount ($)</TableCell>
                  <TableCell align="right">Monthly Amount ($)</TableCell>
                  <TableCell align="right">% Complete</TableCell>
                  <TableCell align="right">Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(0, 20).map((row: any, index: number) => (
                  <TableRow key={`${row.loanNumber}-${row.date}-${index}`}>
                    <TableCell>{dayjs(row.date).format('MMM DD, YYYY')}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`Loan: ${row.scenarioName}`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      ${row.cumulativeAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      ${row.monthlyAmount.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {row.percentComplete.toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">
                      {(row.confidenceLevel * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForecastVisualization; 