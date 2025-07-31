import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon, 
  Delete as DeleteIcon, 
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Dialog from '@mui/material/Dialog';

import { loanForecastAPI } from '../services/api';

import { UploadHistory, DataIngestionResponse, LoanForecastData } from '../types/loan';
import DashboardModal from './DashboardModal';

interface DataUploadProps {
  onForecastDataGenerated?: (data: LoanForecastData[]) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onForecastDataGenerated }) => {
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startMonth, setStartMonth] = useState<Dayjs>(dayjs());
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DataIngestionResponse | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [dashboardBatchId, setDashboardBatchId] = useState<string | null>(null);

  // Load upload history on component mount
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setProgress(null); // clear progress when select new file
    setUploadResult(null);
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a CSV file');
        setSelectedFile(null);
      }
    }
  };

  const fetchUploadHistory = async () => {
    try {
      setLoading(true);
      const history = await loanForecastAPI.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      console.error('Error fetching upload history:', error);
      setError('Failed to fetch upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress({
          status: 'PROCESSING',
          message: 'Processing CSV file...',
          progress: Math.random() * 100
        });
      }, 500);

      const result = await loanForecastAPI.uploadCSV(selectedFile, startMonth.format('YYYY-MM-DD'));
      
      clearInterval(progressInterval);
      setProgress({
        status: 'SUCCESS',
        message: 'Processing completed successfully!',
        progress: 100
      });

      setUploadResult(result);
        
      // Generate forecast visualization
      if (result.loanForecasts && result.loanForecasts.length > 0) {
        const forecastData = result.loanForecasts.map((loan: any) => ({
          ...loan,
          scenarioName: loan.loanNumber || 'N/A',
        }));
        onForecastDataGenerated && onForecastDataGenerated(forecastData);
      }
      
      // Refresh upload history
      await fetchUploadHistory();
      
      // 自动下载CSV文件
      if (result.status === 'SUCCESS' && result.csvUrl) {
        setTimeout(() => {
          handleDownload(result.batchId);
        }, 1000); // 延迟1秒后自动下载
      }
      
      setSelectedFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed: Processing error');
      setProgress({
        status: 'FAILED',
        message: 'Processing failed',
        progress: 0
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteHistory = async (batchId: string) => {
    try {
      await loanForecastAPI.deleteUploadHistory(batchId);
      await fetchUploadHistory();
    } catch (error) {
      console.error('Error deleting upload history:', error);
      setError('Failed to delete upload history');
    }
  };

  const handleDownload = async (batchId: string) => {
    try {
      await loanForecastAPI.downloadForecastCsv(batchId);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setError('Failed to download CSV file');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'PROCESSING':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Data Upload
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <input
              id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              component="label"
              htmlFor="file-input"
              startIcon={<CloudUploadIcon />}
              sx={{ mr: 2 }}
            >
              Select CSV File
            </Button>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 3 }}>
            <DatePicker
              label="Forecast Start Month"
              value={startMonth}
              onChange={(newValue) => setStartMonth(newValue || dayjs())}
              format="YYYY-MM-DD"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                },
              }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 2 }}
          >
            {uploading ? 'Processing...' : 'Upload and Process'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {progress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                {progress.message}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress.progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  }
                }}
              />
            </Box>
          )}
        </Paper>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Processed Forecast
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchUploadHistory}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Batch ID</TableCell>
                  <TableCell>File Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadHistory.map((upload) => (
                  <TableRow key={upload.batchId}>
                    <TableCell>{upload.batchId}</TableCell>
                    <TableCell>{upload.originalFilename}</TableCell>
                    <TableCell>
                      <Chip 
                        label={upload.uploadStatus} 
                        color={getStatusColor(upload.uploadStatus) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {upload.processedRecords}/{upload.totalRecords}
                    </TableCell>
                    <TableCell>
                      {new Date(upload.uploadedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {upload.uploadStatus === 'SUCCESS' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => setDashboardBatchId(upload.batchId)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(upload.batchId)}
                              sx={{ color: theme.palette.success.main }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteHistory(upload.batchId)}
                          sx={{ color: theme.palette.error.main }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {uploadHistory.length === 0 && !loading && (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
              No processed files found. Upload a CSV file to get started.
            </Typography>
          )}
        </Paper>

        <DashboardModal
          open={!!dashboardBatchId}
          onClose={() => setDashboardBatchId(null)}
          batchId={dashboardBatchId || ''}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default DataUpload; 