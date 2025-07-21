import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

// API imports
import { loanForecastAPI } from '../services/api';

// Type imports
import { UploadHistory, DataIngestionResponse, LoanForecastData } from '../types/loan';

interface DataUploadProps {
  onForecastDataGenerated: (data: LoanForecastData[]) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onForecastDataGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startMonth, setStartMonth] = useState<Dayjs>(dayjs());
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DataIngestionResponse | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load upload history on component mount
  useEffect(() => {
    fetchUploadHistory();
  }, []);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
      
      // Generate forecast data for visualization
      if (result.loanForecasts && result.loanForecasts.length > 0) {
        const forecastData = result.loanForecasts.map((loan: any) => ({
          ...loan,
          scenarioName: loan.loanNumber || 'N/A',
        }));
        onForecastDataGenerated(forecastData);
      }
      
      // Refresh upload history
      await fetchUploadHistory();
      
      // Reset form
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
      await fetchUploadHistory(); // Refresh the list
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
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loan Forecast Data Upload
        </Typography>
        
        {/* Upload Form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload CSV File
          </Typography>
          
          <Box sx={{ mb: 2 }}>
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
                sx={{ mr: 2 }}
              >
                Select CSV File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <DatePicker
              label="Forecast Start Month"
              value={startMonth}
              onChange={(newValue) => newValue && setStartMonth(newValue)}
              views={['year', 'month']}
              format="YYYY-MM"
              sx={{ minWidth: 200 }}
            />
          </Box>

          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            startIcon={<CloudUploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload and Process'}
          </Button>

          {uploading && <LinearProgress sx={{ mt: 2 }} />}
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {uploadResult && (
            <Alert 
              severity={uploadResult.status === 'SUCCESS' ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                <strong>Batch ID:</strong> {uploadResult.batchId}<br />
                <strong>Status:</strong> {uploadResult.status}<br />
                <strong>Total Records:</strong> {uploadResult.totalRecords}<br />
                <strong>Processed:</strong> {uploadResult.processedRecords}<br />
                <strong>Failed:</strong> {uploadResult.failedRecords}<br />
                <strong>Message:</strong> {uploadResult.message}
              </Typography>
            </Alert>
          )}
        </Paper>

        {/* Upload History */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Upload History
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchUploadHistory}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {loading ? (
            <LinearProgress />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Batch ID</TableCell>
                    <TableCell>Filename</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Records</TableCell>
                    <TableCell>Uploaded At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadHistory.map((history) => (
                    <TableRow key={history.batchId}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {history.batchId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>{history.originalFilename}</TableCell>
                      <TableCell>
                        <Chip 
                          label={history.uploadStatus} 
                          color={getStatusColor(history.uploadStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {history.totalRecords} total
                        {history.processedRecords !== undefined && (
                          <> ({history.processedRecords} processed)</>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(history.uploadedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const url = loanForecastAPI.downloadForecastFile(history.batchId);
                            window.open(url, '_blank');
                          }}
                          title="Download Forecast CSV"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteHistory(history.batchId)}
                          color="error"
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {uploadHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No upload history found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default DataUpload; 