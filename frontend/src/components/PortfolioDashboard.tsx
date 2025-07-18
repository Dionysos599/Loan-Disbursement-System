import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
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
  Grid,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { TrendingUp, AccountBalance, People, Today } from '@mui/icons-material';
import dayjs from 'dayjs';
interface PortfolioDashboardProps {
  forecastData?: any;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ forecastData }) => {
  const stats = React.useMemo(() => {
    if (!forecastData?.loanForecasts) {
      return {
        totalLoans: 0,
        totalCustomers: 0,
        totalLoanAmount: 0,
        totalForecastedAmount: 0,
        avgLoanAmount: 0,
        propertyTypes: {},
        monthlyTrend: [],
      };
    }

    const loans = forecastData.loanForecasts;
    const totalLoans = loans.length;
    const totalCustomers = new Set(loans.map((loan: any) => loan.customerName)).size;
    const totalLoanAmount = loans.reduce((sum: number, loan: any) => sum + (loan.loanAmount || 0), 0);
    const totalForecastedAmount = loans.reduce((sum: number, loan: any) => sum + (loan.totalForecastedAmount || 0), 0);
    const avgLoanAmount = totalLoanAmount / totalLoans;

    const propertyTypes = loans.reduce((acc: any, loan: any) => {
      const type = loan.propertyType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const monthlyTrend = loans.reduce((acc: any, loan: any) => {
      if (loan.forecastData) {
        Object.entries(loan.forecastData).forEach(([month, amount]: [string, any]) => {
          if (!acc[month]) acc[month] = 0;
          acc[month] += amount;
        });
      }
      return acc;
    }, {});

    return {
      totalLoans,
      totalCustomers,
      totalLoanAmount,
      totalForecastedAmount,
      avgLoanAmount,
      propertyTypes,
      monthlyTrend: Object.entries(monthlyTrend).map(([month, amount]) => ({
        month,
        amount: amount as number,
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
    };
  }, [forecastData]);

  const pieChartData = Object.entries(stats.propertyTypes).map(([type, count]) => ({
    id: type,
    value: count as number,
    label: type,
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Loan Disbursement Dashboard
      </Typography>

      {/* 关键指标卡片 */}
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
                    今日日期
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
                <AccountBalance color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="success.main">
                    ${stats.totalLoanAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    总放贷金额
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
                <People color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="info.main">
                    {stats.totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    放贷客户总数
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
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="warning.main">
                    ${stats.totalForecastedAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    总预测放贷额
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {!forecastData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          请先在 "Data Upload" 页面上传CSV文件以查看详细的预测数据和图表。
        </Alert>
      )}

      {forecastData && (
        <>
          {/* 图表区域 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
            <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    物业类型分布
                  </Typography>
                  {pieChartData.length > 0 ? (
                    <PieChart
                      series={[
                        {
                          data: pieChartData,
                          highlightScope: { fade: 'global', highlight: 'item' },
                        },
                      ]}
                      height={300}
                    />
                  ) : (
                    <Typography color="textSecondary">暂无数据</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    月度预测趋势
                  </Typography>
                  {stats.monthlyTrend.length > 0 ? (
                    <LineChart
                      xAxis={[{ 
                        data: stats.monthlyTrend.slice(0, 12).map(d => dayjs(d.month).format('MMM YY')), 
                        scaleType: 'band' 
                      }]}
                      series={[
                        {
                          data: stats.monthlyTrend.slice(0, 12).map(d => d.amount),
                          label: '预测放贷额',
                          color: '#1976d2',
                        },
                      ]}
                      height={300}
                    />
                  ) : (
                    <Typography color="textSecondary">暂无数据</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* 贷款概览表 */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                贷款概览
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>客户名称</TableCell>
                      <TableCell>物业类型</TableCell>
                      <TableCell align="right">贷款金额</TableCell>
                      <TableCell align="right">预测总额</TableCell>
                      <TableCell align="right">预测月份数</TableCell>
                      <TableCell>到期日</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forecastData.loanForecasts.slice(0, 10).map((loan: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{loan.customerName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={loan.propertyType || 'Unknown'} 
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          ${loan.loanAmount?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="right">
                          ${loan.totalForecastedAmount?.toLocaleString() || 0}
                        </TableCell>
                        <TableCell align="right">
                          {loan.forecastMonths || 0}
                        </TableCell>
                        <TableCell>
                          {loan.extendedDate ? dayjs(loan.extendedDate).format('YYYY-MM-DD') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {forecastData.loanForecasts.length > 10 && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  显示前10条记录，共{forecastData.loanForecasts.length}条
                </Typography>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default PortfolioDashboard; 