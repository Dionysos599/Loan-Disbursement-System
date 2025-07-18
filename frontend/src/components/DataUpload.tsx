import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CloudUpload, Analytics, Timeline } from '@mui/icons-material';
import dayjs, { Dayjs } from 'dayjs';

interface DataUploadProps {
  onForecastGenerated: (forecastData: any) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onForecastGenerated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [startMonth, setStartMonth] = useState<Dayjs>(dayjs().startOf('month'));
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [forecastConfig, setForecastConfig] = useState({
    forecastStartDate: dayjs(),
    forecastEndDate: dayjs().add(2, 'year'),
    forecastModel: 'S-curve',
    steepness: 6.0,
    midpoint: 0.4,
  });
  const [generatingForecast, setGeneratingForecast] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('startMonth', startMonth.format('YYYY-MM-DD'));

      const response = await fetch('http://localhost:8081/api/data-ingestion/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setBatchId(result.batchId);
        setUploadStatus(`Successfully processed ${result.processedRecords} records with forecast data`);
        // 直接使用上传返回的预测数据
        if (result.loanForecasts && result.loanForecasts.length > 0) {
          onForecastGenerated({
            forecastId: result.batchId,
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
          });
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

  const handleGenerateForecast = async () => {
    if (!batchId) return;

    setGeneratingForecast(true);

    try {
      const forecastRequest = {
        batchId,
        forecastStartDate: forecastConfig.forecastStartDate.format('YYYY-MM-DD'),
        forecastEndDate: forecastConfig.forecastEndDate.format('YYYY-MM-DD'),
        forecastModel: forecastConfig.forecastModel,
        steepness: forecastConfig.steepness,
        midpoint: forecastConfig.midpoint,
        // Sample loan data for demonstration
        loanNumber: 'SAMPLE_LOAN_001',
        totalLoanAmount: 5000000,
        currentDrawnAmount: 1000000,
        currentCompletion: 20,
        startDate: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
        maturityDate: dayjs().add(18, 'month').format('YYYY-MM-DD'),
      };

      const response = await fetch('http://localhost:8082/api/forecasting/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(forecastRequest),
      });

      const result = await response.json();

      if (response.ok) {
        onForecastGenerated(result);
        setForecastDialogOpen(false);
        setUploadStatus('Forecast generated successfully!');
      } else {
        setUploadStatus(`Forecast generation failed: ${result.message}`);
      }
    } catch (error) {
      setUploadStatus('Forecast generation failed: Network error');
      console.error('Forecast error:', error);
    } finally {
      setGeneratingForecast(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
            Data Upload & Forecasting
          </Typography>
          
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Upload your loan disbursement CSV file to generate forecasts and visualizations.
          </Typography>

          {/* File Upload Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ minWidth: 200 }}
              >
                SELECT CSV FILE
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileSelect}
                />
              </Button>
              
              {selectedFile && (
                <Chip
                  label={selectedFile.name}
                  onDelete={() => setSelectedFile(null)}
                  color="primary"
                />
              )}
              
              <DatePicker
                label="预测起点"
                value={startMonth}
                onChange={(date) => setStartMonth(date || dayjs().startOf('month'))}
                views={['year', 'month']}
                format="YYYY-MM"
                sx={{ minWidth: 150 }}
              />
              
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                startIcon={uploading ? <LinearProgress /> : <CloudUpload />}
                sx={{ minWidth: 200 }}
              >
                {uploading ? 'UPLOADING...' : 'UPLOAD & PROCESS'}
              </Button>
            </Box>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Processing file...
              </Typography>
            </Box>
          )}

          {/* Status Messages */}
          {uploadStatus && (
            <Alert 
              severity={uploadStatus.includes('Success') ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              {uploadStatus}
            </Alert>
          )}

          {/* Batch ID Display */}
          {batchId && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Batch ID: <Chip label={batchId} size="small" />
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Forecast Configuration Dialog */}
      <Dialog 
        open={forecastDialogOpen} 
        onClose={() => setForecastDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
          Configure Forecast Parameters
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <DatePicker
              label="Forecast Start Date"
              value={forecastConfig.forecastStartDate}
              onChange={(date) => setForecastConfig({
                ...forecastConfig,
                forecastStartDate: date || dayjs()
              })}
            />
            
            <DatePicker
              label="Forecast End Date"
              value={forecastConfig.forecastEndDate}
              onChange={(date) => setForecastConfig({
                ...forecastConfig,
                forecastEndDate: date || dayjs().add(2, 'year')
              })}
            />
            
            <FormControl fullWidth>
              <InputLabel>Forecast Model</InputLabel>
              <Select
                value={forecastConfig.forecastModel}
                label="Forecast Model"
                onChange={(e) => setForecastConfig({
                  ...forecastConfig,
                  forecastModel: e.target.value
                })}
              >
                <MenuItem value="S-curve">S-Curve</MenuItem>
                <MenuItem value="linear">Linear</MenuItem>
                <MenuItem value="multiple">Multiple Scenarios</MenuItem>
              </Select>
            </FormControl>
            
            {forecastConfig.forecastModel === 'S-curve' && (
              <>
                <TextField
                  label="Steepness"
                  type="number"
                  value={forecastConfig.steepness}
                  onChange={(e) => setForecastConfig({
                    ...forecastConfig,
                    steepness: parseFloat(e.target.value) || 6.0
                  })}
                  inputProps={{ step: 0.1, min: 1, max: 20 }}
                />
                
                <TextField
                  label="Midpoint"
                  type="number"
                  value={forecastConfig.midpoint}
                  onChange={(e) => setForecastConfig({
                    ...forecastConfig,
                    midpoint: parseFloat(e.target.value) || 0.4
                  })}
                  inputProps={{ step: 0.1, min: 0, max: 1 }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForecastDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateForecast}
            variant="contained"
            disabled={generatingForecast}
            startIcon={<Timeline />}
          >
            {generatingForecast ? 'Generating...' : 'Generate Forecast'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataUpload; 