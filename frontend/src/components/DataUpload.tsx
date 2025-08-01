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
  const wsRef = useRef<WebSocket | null>(null);
  const [dashboardBatchId, setDashboardBatchId] = useState<string | null>(null);

  // Load upload history on component mount
  useEffect(() => {
    fetchUploadHistory();
  }, []);

  useEffect(() => {
    const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8081/ws/progress';
    const ws = new WebSocket(WS_BASE_URL);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setProgress(msg);
        
        // Immediately check if it's SUCCESS status and refresh history list
        if (msg && msg.status === 'SUCCESS') {
          fetchUploadHistory();
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, 'Raw data:', event.data);
      }
    };
    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
    };
    ws.onclose = () => {
      console.log('WebSocket closed');
    };
    return () => {
      ws.close();
    };
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

  // refresh history when success
  useEffect(() => {
    if (progress && progress.status === 'SUCCESS') {
      console.log('Progress SUCCESS, refreshing upload history...'); // Add debug log
      fetchUploadHistory();
    }
  }, [progress]);

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

      const result = await loanForecastAPI.uploadCSV(selectedFile, startMonth.format('YYYY-MM-DD'));
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
      
      setSelectedFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed: Network error');
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
      <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
        {/* Header */}
        <Box sx={{ mb: 4, mt: -1.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <img src={process.env.PUBLIC_URL + '/APB_Logo_New.png'} alt="American Plus Bank Logo" style={{ width: '30%', height: 'auto', minWidth: 120, maxWidth: 400 }} />
        </Box>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#15418C', mb: 2 }}>
            Loan Disbursement Forecast System
          </Typography>
          <Typography variant="body1" sx={{ color: '#15418C', fontSize: 20, mb: 2 }}>
            Upload CSV files for loan forecast processing and analysis
          </Typography>
        </Box>

        {/* Upload Form */}
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
            Upload CSV File
          </Typography>

          {/* Upload Controls in Single Row */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3, 
            mb: 3,
            flexWrap: 'wrap'
          }}>
            {/* File Selection */}
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <input
                id="file-input"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input">
              <Button
                variant="outlined"
                component="span"
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    width: '100%',
                    height: '56px',
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    }
                  }}
              >
                  {selectedFile ? 'Change File' : 'Select CSV File'}
              </Button>
            </label>
          </Box>

            {/* Date Picker */}
            <Box sx={{ flex: '0 0 200px' }}>
              <DatePicker
                label="Forecast Start Month"
                value={startMonth}
                onChange={(newValue) => newValue && setStartMonth(newValue)}
                views={['year', 'month']}
                format="YYYY-MM"
                sx={{ width: '100%' }}
              />
          </Box>

            {/* Upload Button */}
            <Box sx={{ flex: '0 0 auto' }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={<CloudUploadIcon />}
            sx={{ 
              height: '56px',
              px: 4,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: '#15418C',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#C0392B',
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              }
            }}
          >
                {uploading ? 'Processing...' : 'Upload & Process'}
          </Button>
            </Box>
          </Box>

          {/* File Info */}
          {selectedFile && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: alpha(theme.palette.success.main, 0.08),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 2,
              mb: 2
            }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Selected: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
            </Box>
          )}

          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Processing your file...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {progress && progress.status === 'PROCESSING' && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ textAlign: 'left' }}>
                File received, start processing...
              </Typography>
            </Alert>
          )}
          {progress && progress.status === 'SUCCESS' && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ textAlign: 'left' }}>
                <strong>Total Records:</strong> {progress.totalRecords}<br />
                <strong>Processed:</strong> {progress.processedRecords}<br />
                <strong>Time:</strong> {progress.timestamp ? new Date(progress.timestamp).toLocaleTimeString() : ''}
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Upload History */}
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'left' }}>
                Generated forecast data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                Track the forecast data generated previously uploaded
            </Typography>
            </Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchUploadHistory}
              disabled={loading}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#15418C' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Filename</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Records</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Upload Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#fff' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadHistory.map((history) => (
                    <TableRow 
                      key={history.batchId}
                      hover
                      sx={{ 
                        cursor: history.uploadStatus === 'PROCESSING' ? 'not-allowed' : 'pointer',
                        '&:hover': { 
                          backgroundColor: history.uploadStatus === 'PROCESSING' ? 'transparent' : '#FDEDEC' 
                        },
                        opacity: history.uploadStatus === 'PROCESSING' ? 0.6 : 1
                      }}
                      onClick={() => {
                        if (history.uploadStatus !== 'PROCESSING') {
                          setDashboardBatchId(history.batchId);
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {history.originalFilename}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={history.uploadStatus} 
                          color={getStatusColor(history.uploadStatus) as any}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          <strong>{history.totalRecords}</strong> total
                          {history.processedRecords !== undefined && (
                            <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                              ({history.processedRecords} processed)
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(() => {
                            const d = new Date(history.uploadedAt);
                            return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          })()}
                        </Typography>
                      </TableCell>
                        <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            disabled={history.uploadStatus === 'PROCESSING'}
                            onClick={e => {
                              e.stopPropagation();
                              const url = loanForecastAPI.downloadForecastFile(history.batchId);
                              window.open(url, '_blank');
                            }}
                            title={history.uploadStatus === 'PROCESSING' ? 'Processing...' : 'Download Forecast CSV'}
                            sx={{ 
                              color: history.uploadStatus === 'PROCESSING' ? theme.palette.action.disabled : theme.palette.info.main,
                              '&:hover': { 
                                backgroundColor: history.uploadStatus === 'PROCESSING' ? 'transparent' : alpha(theme.palette.info.main, 0.1) 
                              }
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={history.uploadStatus === 'PROCESSING'}
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteHistory(history.batchId);
                            }}
                            title={history.uploadStatus === 'PROCESSING' ? 'Processing...' : 'Delete'}
                            sx={{ 
                              color: history.uploadStatus === 'PROCESSING' ? theme.palette.action.disabled : theme.palette.error.main,
                              '&:hover': { 
                                backgroundColor: history.uploadStatus === 'PROCESSING' ? 'transparent' : alpha(theme.palette.error.main, 0.1) 
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {uploadHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box sx={{ py: 4 }}>
                          <Typography color="text.secondary" variant="body1">
                            No upload history found
                          </Typography>
                          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                            Upload your first CSV file to get started
                          </Typography>
                        </Box>
                        </TableCell>
                      </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
      <Dialog open={!!dashboardBatchId} onClose={() => setDashboardBatchId(null)} maxWidth="xl" fullWidth>
        {dashboardBatchId && (
          <DashboardModal batchId={dashboardBatchId} open={!!dashboardBatchId} onClose={() => setDashboardBatchId(null)} />
        )}
      </Dialog>
    </LocalizationProvider>
  );
};

export default DataUpload; 