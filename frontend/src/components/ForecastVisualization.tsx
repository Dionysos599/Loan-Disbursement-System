import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { TrendingUp, Analytics, Timeline } from '@mui/icons-material';
import dayjs from 'dayjs';

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
  };
}

const ForecastVisualization: React.FC<ForecastVisualizationProps> = ({ forecastData }) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [chartType, setChartType] = useState<'cumulative' | 'monthly'>('cumulative');

  // Get unique scenarios
  const scenarios = useMemo(() => {
    const scenarioNames = forecastData.forecastData.map(d => d.scenarioName);
    const uniqueScenarios = Array.from(new Set(scenarioNames));
    return uniqueScenarios;
  }, [forecastData.forecastData]);

  // Filter data based on selected scenario
  const filteredData = useMemo(() => {
    if (selectedScenario === 'all') {
      return forecastData.forecastData;
    }
    return forecastData.forecastData.filter(d => d.scenarioName === selectedScenario);
  }, [forecastData.forecastData, selectedScenario]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const groupedByDate = filteredData.reduce((acc, item) => {
      const date = dayjs(item.date).format('MMM YYYY');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {} as Record<string, ForecastData[]>);

    return Object.entries(groupedByDate).map(([date, items]) => {
      const totalCumulative = items.reduce((sum, item) => sum + item.cumulativeAmount, 0);
      const totalMonthly = items.reduce((sum, item) => sum + item.monthlyAmount, 0);
      const avgPercentComplete = items.reduce((sum, item) => sum + item.percentComplete, 0) / items.length;

      return {
        date,
        cumulative: totalCumulative,
        monthly: totalMonthly,
        percentComplete: avgPercentComplete,
      };
    }).sort((a, b) => dayjs(a.date, 'MMM YYYY').diff(dayjs(b.date, 'MMM YYYY')));
  }, [filteredData]);

  // Prepare scenario comparison data
  const scenarioComparisonData = useMemo(() => {
    const scenarioData = scenarios.map(scenario => {
      const scenarioItems = forecastData.forecastData.filter(d => d.scenarioName === scenario);
      const maxCumulative = Math.max(...scenarioItems.map(d => d.cumulativeAmount));
      const avgMonthly = scenarioItems.reduce((sum, d) => sum + d.monthlyAmount, 0) / scenarioItems.length;
      
      return {
        scenario,
        maxCumulative,
        avgMonthly,
        confidence: scenarioItems[0]?.confidenceLevel || 0,
      };
    });

    return scenarioData;
  }, [forecastData.forecastData, scenarios]);

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
                Forecast ID: {forecastData.forecastId} | Model: {forecastData.forecastModel}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Chip 
                label={forecastData.status} 
                color={forecastData.status === 'COMPLETED' ? 'success' : 'warning'}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                Generated: {dayjs(forecastData.generatedAt).format('MMM DD, YYYY HH:mm')}
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
              <InputLabel>Scenario</InputLabel>
              <Select
                value={selectedScenario}
                label="Scenario"
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                <MenuItem value="all">All Scenarios</MenuItem>
                {scenarios.map(scenario => (
                  <MenuItem key={scenario} value={scenario}>
                    {scenario}
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
                xAxis={[{ data: chartData.map(d => d.date), scaleType: 'band' }]}
                series={[
                  {
                    data: chartData.map(d => d.cumulative),
                    label: 'Cumulative Amount ($)',
                    color: '#1976d2',
                  },
                ]}
                height={400}
              />
            ) : (
              <BarChart
                xAxis={[{ data: chartData.map(d => d.date), scaleType: 'band' }]}
                series={[
                  {
                    data: chartData.map(d => d.monthly),
                    label: 'Monthly Amount ($)',
                    color: '#2e7d32',
                  },
                ]}
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
                ${Math.max(...chartData.map(d => d.cumulative)).toLocaleString()}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Average Monthly Disbursement</Typography>
              <Typography variant="h6">
                ${(chartData.reduce((sum, d) => sum + d.monthly, 0) / chartData.length).toLocaleString()}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">Peak Month</Typography>
              <Typography variant="h6">
                {chartData.reduce((max, d) => d.monthly > max.monthly ? d : max, chartData[0]).date}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="textSecondary">Forecast Period</Typography>
              <Typography variant="h6">
                {dayjs(forecastData.forecastStartDate).format('MMM YYYY')} - {dayjs(forecastData.forecastEndDate).format('MMM YYYY')}
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
                  {scenarioComparisonData.map((row) => (
                    <TableRow key={row.scenario}>
                      <TableCell>
                        <Chip label={row.scenario} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        ${row.maxCumulative.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${row.avgMonthly.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {(row.confidence * 100).toFixed(1)}%
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
                  <TableCell>Scenario</TableCell>
                  <TableCell align="right">Cumulative Amount ($)</TableCell>
                  <TableCell align="right">Monthly Amount ($)</TableCell>
                  <TableCell align="right">% Complete</TableCell>
                  <TableCell align="right">Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{dayjs(row.date).format('MMM DD, YYYY')}</TableCell>
                    <TableCell>
                      <Chip label={row.scenarioName} size="small" />
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