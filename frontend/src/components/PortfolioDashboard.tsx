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

  // 加载最新的成功上传
  const loadLatestUpload = async () => {
    setLoading(true);
    setError(null);
    try {
      const upload = await dataIngestionAPI.getLatestSuccessfulUpload();
      setLatestUpload(upload);
      
      // 如果有最新上传且没有传入的forecastData，尝试加载预测数据
      if (upload && !forecastData) {
        try {
          const forecastData = await dataIngestionAPI.getForecastData(upload.batchId);
          setLatestForecastData(forecastData);
        } catch (error) {
          console.warn('Failed to load forecast data:', error);
          // 不设置错误，因为这不是关键错误
        }
      }
    } catch (error) {
      console.error('Failed to load latest upload:', error);
      setError('无法加载最新上传数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestUpload();
  }, [forecastData]);

  // 计算统计数据
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
        averageCompletion: 0, // TODO: 计算平均完成度
        totalForecastedAmount: displayData.summary.totalForecastedAmount || 0
      };
    }

    // 如果是从upload返回的数据，计算统计
    if (displayData.loanForecasts) {
      const totalAmount = displayData.loanForecasts.reduce((sum: number, loan: any) => 
        sum + (loan.loanAmount || 0), 0);
      const totalForecasted = displayData.loanForecasts.reduce((sum: number, loan: any) => 
        sum + (loan.totalForecastedAmount || 0), 0);
      
      return {
        totalLoanAmount: totalAmount,
        totalCustomers: displayData.loanForecasts.length,
        averageCompletion: 0, // TODO: 计算平均完成度
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

  // 准备图表数据
  const chartData = React.useMemo(() => {
    if (!displayData) return [];

    // 如果是从forecastData来的数据
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

      return Object.values(monthlyData).slice(0, 12); // 只显示前12个月
    }

    // 如果是从loanForecasts来的数据
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
          资产组合仪表板
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadLatestUpload}
          disabled={loading}
        >
          刷新数据
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!displayData && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          暂无预测数据。请先上传CSV文件生成预测数据。
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
              最新预测数据
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">文件名</Typography>
                <Typography variant="body1">{latestUpload.originalFilename}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">上传时间</Typography>
                <Typography variant="body1">{dayjs(latestUpload.uploadedAt).format('YYYY-MM-DD HH:mm')}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">处理记录数</Typography>
                <Typography variant="body1">{latestUpload.processedRecords}/{latestUpload.totalRecords}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

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
                <AccountBalance color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" color="secondary">
                    ${statsData.totalLoanAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    总贷款金额
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
                    客户总数
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
                    平均完成度
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 预测趋势图表 */}
      {chartData.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ mr: 1 }} />
              预测趋势
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
                    name="累计预测金额"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 总计预测金额卡片 */}
      {statsData.totalForecastedAmount > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              预测总览
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">总预测金额</Typography>
                <Typography variant="h5" color="primary">
                  ${statsData.totalForecastedAmount.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">预测开始日期</Typography>
                <Typography variant="h6">
                  {displayData?.forecastStartDate ? dayjs(displayData.forecastStartDate).format('YYYY年MM月') : '-'}
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