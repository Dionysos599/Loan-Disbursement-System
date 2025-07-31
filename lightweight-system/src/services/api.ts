import { UploadHistory, DataIngestionResponse, LoanForecastData } from '../types/loan';
import { localStorageService } from './localStorage';
import { csvProcessor } from './csvProcessor';

// Simulate delay to provide better user experience
const simulateProcessing = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const loanForecastAPI = {
  // Upload CSV file
  async uploadCSV(file: File, startMonth: string): Promise<DataIngestionResponse> {
    try {
      // Create initial upload record
      const batchId = csvProcessor.generateBatchId();
      const initialUpload: UploadHistory = {
        batchId,
        originalFilename: file.name,
        fileSize: file.size,
        uploadStatus: 'PROCESSING',
        uploadedAt: new Date().toISOString(),
        totalRecords: 0,
        processedRecords: 0,
        failedRecords: 0
      };

      // Save initial record
      localStorageService.addUploadHistory(initialUpload);

      // Simulate processing delay
      await simulateProcessing(2000);

      // Process CSV file using the same batchId
      const result = await csvProcessor.processUploadWithBatchId(file, startMonth, batchId);
      

      localStorageService.updateUploadStatus(batchId, result.status, result.csvUrl);

      // Save forecast data
      if (result.loanForecasts && result.loanForecasts.length > 0) {
        localStorageService.saveForecastData(batchId, result.loanForecasts);
      }

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Upload failed: Processing error');
    }
  },

  // Get upload history
  async getUploadHistory(): Promise<UploadHistory[]> {
    try {
      // Simulate network delay
      await simulateProcessing(500);
      return localStorageService.getUploadHistory();
    } catch (error) {
      console.error('Error fetching upload history:', error);
      return [];
    }
  },

  // Get latest successful upload
  async getLatestSuccessfulUpload(): Promise<UploadHistory | null> {
    try {
      // Simulate network delay
      await simulateProcessing(300);
      return localStorageService.getLatestSuccessfulUpload();
    } catch (error) {
      console.error('Error fetching latest upload:', error);
      return null;
    }
  },

  // Delete upload history
  async deleteUploadHistory(batchId: string): Promise<void> {
    try {
      // Simulate network delay
      await simulateProcessing(500);
      localStorageService.deleteUploadHistory(batchId);
    } catch (error) {
      console.error('Error deleting upload history:', error);
      throw new Error('Failed to delete upload history');
    }
  },

  // Get forecast data
  async getForecastData(batchId: string): Promise<LoanForecastData[]> {
    try {
      // Simulate network delay
      await simulateProcessing(300);
      return localStorageService.getForecastData(batchId);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      return [];
    }
  },

  // Download forecast CSV
  async downloadForecastCsv(batchId: string): Promise<void> {
    try {
      console.log('Starting download for batchId:', batchId);
      
      const uploadHistory = localStorageService.getUploadHistory();
      console.log('Upload history:', uploadHistory);
      console.log('Upload history batchIds:', uploadHistory.map(item => item.batchId));
      
      const upload = uploadHistory.find(item => item.batchId === batchId);
      console.log('Found upload:', upload);
      
      if (!upload) {
        throw new Error('Upload record not found');
      }

      // Get forecast data
      const forecastData = localStorageService.getForecastData(batchId);
      console.log('Forecast data:', forecastData);
      
      if (!forecastData || forecastData.length === 0) {
        throw new Error('Forecast data not found');
      }
      
      // Generate CSV URL
      const csvUrl = csvProcessor.generateForecastCsv(forecastData, upload.originalFilename);
      console.log('Generated CSV URL:', csvUrl);
      
      // Update csvUrl in localStorage
      localStorageService.updateUploadStatus(batchId, upload.uploadStatus, csvUrl);
      
      // Create download link
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `${upload.originalFilename.replace(/\.[^.]*$/, '')}_forecast.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Download link clicked successfully');

      // Clean up URL object
      setTimeout(() => {
        URL.revokeObjectURL(csvUrl);
      }, 1000);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw new Error('Failed to download CSV file');
    }
  },

  // Health check (simulated)
  async ping(): Promise<string> {
    await simulateProcessing(100);
    return 'Pong';
  }
};

// For backward compatibility, keep the old API name
export const dataIngestionAPI = loanForecastAPI; 