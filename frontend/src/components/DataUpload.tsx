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
import { CloudUpload, TrendingUp, Assessment, Delete, Refresh, Download } from '@mui/icons-material';
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

  // Upload history
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
        
        // reload upload history
        loadUploadHistory();
        
        // generate forecast data for frontend
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
                monthlyAmount: amount, // TODO: calculate monthly increment
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
      loadUploadHistory(); // reload list
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

      {/* File upload area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CloudUpload sx={{ mr: 1 }} />
            Upload CSV file
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
                Select CSV file
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
                label="Forecast start month"
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
            {uploading ? 'Uploading...' : 'Upload and generate forecast'}
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

      {/* Upload history area */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ mr: 1 }} />
              Upload history
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadUploadHistory}
              disabled={loadingHistory}
            >
              Refresh
            </Button>
          </Box>

          {loadingHistory ? (
            <LinearProgress />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>File size</TableCell>
                    <TableCell>Total records</TableCell>
                    <TableCell>Processed successfully</TableCell>
                    <TableCell>Processed failed</TableCell>
                    <TableCell>Upload time</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No upload history
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
                            aria-label="download"
                            color="primary"
                            onClick={() => {
                              const url = dataIngestionAPI.downloadOriginalFile(history.batchId);
                              window.open(url, '_blank');
                            }}
                            size="small"
                            title="Download original file"
                          >
                            <Download />
                          </IconButton>
                          <IconButton
                            aria-label="delete"
                            color="error"
                            onClick={() => handleDeleteHistory(history.batchId)}
                            size="small"
                            title="Delete history"
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

      {/* Forecast generation dialog */}
      <Dialog open={forecastDialogOpen} onClose={() => setForecastDialogOpen(false)}>
        <DialogTitle>Generate forecast</DialogTitle>
        <DialogContent>
          <Typography>
            File uploaded successfully! Do you want to generate forecast now?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForecastDialogOpen(false)}>
            Later
          </Button>
          <Button onClick={handleGenerateForecast} variant="contained">
            Generate forecast
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataUpload; 