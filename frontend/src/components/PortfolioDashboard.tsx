import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import dayjs from 'dayjs';
import { PortfolioExposure, MonthlyProjection } from '../types/loan';
import { portfolioApi } from '../services/api';

const PortfolioDashboard: React.FC = () => {
  const [exposure, setExposure] = useState<PortfolioExposure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolioExposure();
  }, []);

  const loadPortfolioExposure = async () => {
    try {
      setLoading(true);
      const data = await portfolioApi.getExposure();
      setExposure(data);
      setError(null);
    } catch (err) {
      setError('Failed to load portfolio exposure');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!exposure) {
    return <Alert severity="warning">No portfolio data available</Alert>;
  }

  const pieChartData = Object.entries(exposure.exposureByType).map(([type, amount]) => ({
    id: type,
    value: amount,
    label: type,
  }));

  const lineChartData = exposure.monthlyProjections.map(proj => ({
    month: dayjs(proj.month).format('MMM YYYY'),
    total: proj.totalExposure,
    construction: proj.constructionExposure,
    multifamily: proj.multifamilyExposure,
    cre: proj.creExposure,
  }));

  const getExposureColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'construction':
        return 'primary';
      case 'multifamily':
        return 'secondary';
      case 'cre':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Portfolio Exposure Dashboard
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Total Exposure Card */}
        <Box sx={{ width: { xs: '100%', md: '30%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Portfolio Exposure
              </Typography>
              <Typography variant="h3" color="primary">
                ${exposure.totalExposure.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Current exposure across all loan types
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Exposure by Type */}
        <Box sx={{ width: { xs: '100%', md: '65%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exposure by Loan Type
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {Object.entries(exposure.exposureByType).map(([type, amount]) => (
                  <Box sx={{ width: { xs: '100%', sm: '48%', md: '30%' } }} key={type}>
                    <Box textAlign="center">
                      <Typography variant="h5" color="primary">
                        ${amount.toLocaleString()}
                      </Typography>
                      <Chip 
                        label={type} 
                        color={getExposureColor(type) as any}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Pie Chart */}
        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exposure Distribution
              </Typography>
              <PieChart
                series={[
                  {
                    data: pieChartData,
                    highlightScope: { fade: 'global', highlight: 'item' },
                  },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Line Chart */}
        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Exposure Projections
              </Typography>
              <LineChart
                xAxis={[{ data: lineChartData.map(d => d.month), scaleType: 'band' }]}
                series={[
                  {
                    data: lineChartData.map(d => d.total),
                    label: 'Total Exposure',
                    color: '#1976d2',
                  },
                  {
                    data: lineChartData.map(d => d.construction),
                    label: 'Construction',
                    color: '#dc004e',
                  },
                  {
                    data: lineChartData.map(d => d.multifamily),
                    label: 'Multifamily',
                    color: '#9c27b0',
                  },
                  {
                    data: lineChartData.map(d => d.cre),
                    label: 'CRE',
                    color: '#2e7d32',
                  },
                ]}
                height={300}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Monthly Projections Table */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Exposure Projections
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Total Exposure</TableCell>
                      <TableCell align="right">Construction</TableCell>
                      <TableCell align="right">Multifamily</TableCell>
                      <TableCell align="right">CRE</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exposure.monthlyProjections.map((proj, index) => (
                      <TableRow key={index}>
                        <TableCell>{dayjs(proj.month).format('MMM YYYY')}</TableCell>
                        <TableCell align="right">
                          ${proj.totalExposure.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ${proj.constructionExposure.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ${proj.multifamilyExposure.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          ${proj.creExposure.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default PortfolioDashboard; 