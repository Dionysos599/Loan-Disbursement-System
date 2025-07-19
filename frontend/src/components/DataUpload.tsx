import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { CloudUpload, TrendingUp, Assessment, Delete, Refresh } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { dataIngestionAPI } from '../services/api';

interface DataUploadProps {
  onForecastGenerated: (data: any) => void;
}

interface UploadHistory {
  id: number;
  batchId: string;
  originalFilename: string;
  fileSize: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  uploadStatus: string;
  forecastStartDate: string;
  uploadedAt: string;
  processedAt: string;
  errorMessage?: string;
}

const DataUpload: React.FC<DataUploadProps> = ({ onForecastGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [batchId, setBatchId] = useState<string>('');
  const [startMonth, setStartMonth] = useState<Dayjs>(dayjs().add(1, 'month').startOf('month'));
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 加载上传历史
  const loadUploadHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await dataIngestionAPI.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      console.error('Failed to load upload history:', error);
      setUploadStatus('Failed to load upload history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadUploadHistory();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadStatus('');

    try {
      const result = await dataIngestionAPI.uploadCSV(selectedFile, startMonth.format('YYYY-MM-DD'));
      
      if (result.status === 'SUCCESS') {
        setUploadStatus(`Upload successful! Processed ${result.processedRecords} records.`);
        setBatchId(result.batchId);
        
        // 重新加载上传历史
        loadUploadHistory();
        
        // 生成前端显示的数据结构
        if (result.loanForecasts && result.loanForecasts.length > 0) {
          const forecastData = {
            batchId: result.batchId,
            status: 'COMPLETED',
            generatedAt: result.processedAt,
            forecastStartDate: startMonth.format('YYYY-MM-DD'),
            forecastEndDate: startMonth.add(2, 'year').format('YYYY-MM-DD'),
            forecastModel: 'S-curve',
            forecastData: result.loanForecasts.flatMap((loan: any) => 
              Object.entries(loan.forecastData || {}).map(([date, amount]) => ({
                loanNumber: loan.loanNumber || 'N/A',
                date: date,
                cumulativeAmount: amount,
                monthlyAmount: amount, // 这里可以计算月度增量
                percentComplete: 0,
                forecastType: 'S-curve',
                scenarioName: loan.customerName || 'Unknown',
                confidenceLevel: 0.85,
              }))
            ),
            summary: {
              totalLoans: result.processedRecords,
              totalForecastedAmount: result.loanForecasts.reduce((sum: number, loan: any) => sum + (loan.totalForecastedAmount || 0), 0)
            },
            message: result.message
          };

          onForecastGenerated(forecastData);
        } else {
          setForecastDialogOpen(true);
        }
      } else {
        setUploadStatus(`Upload failed: ${result.message}`);
      }
    } catch (error) {
      setUploadStatus('Upload failed: Network error');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteHistory = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to delete this upload history?')) {
      return;
    }

    try {
      await dataIngestionAPI.deleteUploadHistory(batchId);
      setUploadStatus('Upload history deleted successfully');
      loadUploadHistory(); // 重新加载列表
    } catch (error) {
      console.error('Failed to delete upload history:', error);
      setUploadStatus('Failed to delete upload history');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      SUCCESS: { color: 'success' as const, label: 'Success' },
      FAILED: { color: 'error' as const, label: 'Failed' },
      PROCESSING: { color: 'warning' as const, label: 'Processing' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default' as const, label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleGenerateForecast = async () => {
    if (!batchId) return;

    try {
      // TODO: Call forecast generation API
      setForecastDialogOpen(false);
      setUploadStatus('Forecast generated successfully!');
    } catch (error) {
      console.error('Forecast generation failed:', error);
      setUploadStatus('Forecast generation failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        数据上传与预测
      </Typography>

      {/* 文件上传区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUpload sx={{ mr: 1 }} />
            上传CSV文件
          </Typography>

          <Box sx={{ mb: 3 }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                sx={{ mr: 2 }}
              >
                选择CSV文件
              </Button>
            </label>

            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                已选择: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="预测开始月份"
                value={startMonth}
                onChange={(newValue) => setStartMonth(newValue || dayjs())}
                views={['year', 'month']}
                sx={{ width: 250 }}
              />
            </LocalizationProvider>
          </Box>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={<TrendingUp />}
            sx={{ mb: 2 }}
          >
            {uploading ? '上传中...' : '上传并生成预测'}
          </Button>

          {uploading && <LinearProgress sx={{ mb: 2 }} />}

          {uploadStatus && (
            <Alert 
              severity={uploadStatus.includes('successful') || uploadStatus.includes('SUCCESS') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {uploadStatus}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 上传历史区域 */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              上传历史
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadUploadHistory}
              disabled={loadingHistory}
            >
              刷新
            </Button>
          </Box>

          {loadingHistory ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>文件名</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>文件大小</TableCell>
                    <TableCell>总记录数</TableCell>
                    <TableCell>处理成功</TableCell>
                    <TableCell>处理失败</TableCell>
                    <TableCell>上传时间</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        暂无上传记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploadHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>{history.originalFilename}</TableCell>
                        <TableCell>{getStatusChip(history.uploadStatus)}</TableCell>
                        <TableCell>{formatFileSize(history.fileSize)}</TableCell>
                        <TableCell>{history.totalRecords || 0}</TableCell>
                        <TableCell>{history.processedRecords || 0}</TableCell>
                        <TableCell>{history.failedRecords || 0}</TableCell>
                        <TableCell>{dayjs(history.uploadedAt).format('YYYY-MM-DD HH:mm')}</TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteHistory(history.batchId)}
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 预测生成对话框 */}
      <Dialog open={forecastDialogOpen} onClose={() => setForecastDialogOpen(false)}>
        <DialogTitle>生成预测</DialogTitle>
        <DialogContent>
          <Typography>
            文件上传成功！是否立即生成预测？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForecastDialogOpen(false)}>
            稍后
          </Button>
          <Button onClick={handleGenerateForecast} variant="contained">
            生成预测
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataUpload; 