import axios from 'axios';
import { Loan, CalculateScheduleRequest, UpdateProgressRequest, ExtendMaturityRequest, PortfolioExposure } from '../types/loan';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Data upload related interfaces
export const dataIngestionAPI = {
  // Upload CSV file
  uploadCSV: async (file: File, startMonth: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startMonth', startMonth);
    
    const response = await api.post('/data-ingestion/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Get upload history list
  getUploadHistory: async () => {
    const response = await api.get('/data-ingestion/upload-history');
    return response.data;
  },
  
  // Get latest successful upload
  getLatestSuccessfulUpload: async () => {
    const response = await api.get('/data-ingestion/upload-history/latest');
    return response.data;
  },
  
  // Delete upload history
  deleteUploadHistory: async (batchId: string) => {
    const response = await api.delete(`/data-ingestion/upload-history/${batchId}`);
    return response.data;
  },
  
  // Get forecast data for specific batch
  getForecastData: async (batchId: string) => {
    const response = await api.get(`/data-ingestion/upload-history/${batchId}/forecast-data`);
    return response.data;
  },
  
  // Get processing status
  getProcessingStatus: async (batchId: string) => {
    const response = await api.get(`/data-ingestion/status/${batchId}`);
    return response.data;
  },
  
  // Health check
  healthCheck: async () => {
    const response = await api.get('/data-ingestion/health');
    return response.data;
  },
};

// Forecast service related interfaces
export const forecastingAPI = {
  // Generate forecast
  generateForecast: async (data: any) => {
    const response = await api.post('/forecasting/forecast', data);
    return response.data;
  },
  
  // Health check
  healthCheck: async () => {
    const response = await api.get('/forecasting/health');
    return response.data;
  },
};

// Loan management related interfaces
export const loanAPI = {
  // Get loan list
  getLoans: async () => {
    const response = await api.get('/loans');
    return response.data;
  },
  
  // Get single loan details
  getLoanDetails: async (loanId: string) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },
  
  // Update loan progress
  updateLoanProgress: async (loanId: string, progressData: any) => {
    const response = await api.put(`/loans/${loanId}/progress`, progressData);
    return response.data;
  },
  
  // Calculate repayment schedule
  calculateSchedule: async (loanId: string, scheduleData: any) => {
    const response = await api.post(`/loans/${loanId}/calculate-schedule`, scheduleData);
    return response.data;
  },
  
  // Get portfolio risk exposure
  getPortfolioExposure: async () => {
    const response = await api.get('/portfolio/exposure');
    return response.data;
  },
};

export default api; 