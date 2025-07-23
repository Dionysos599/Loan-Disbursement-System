import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// =========== Core service API ===========
// Loan forecast related interfaces
export const loanForecastAPI = {
  // Upload CSV file
  uploadCSV: async (file: File, startMonth: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startMonth', startMonth);
    
    const response = await api.post('/loan-forecast/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Get upload history list
  getUploadHistory: async () => {
    const response = await api.get('/loan-forecast/upload-history');
    return response.data;
  },
  
  // Get latest successful upload
  getLatestSuccessfulUpload: async () => {
    const response = await api.get('/loan-forecast/upload-history/latest');
    return response.data;
  },
  
  // Delete upload history
  deleteUploadHistory: async (batchId: string) => {
    const response = await api.delete(`/loan-forecast/upload-history/${batchId}`);
    return response.data;
  },
  
  // Get forecast data for specific batch
  getForecastData: async (batchId: string) => {
    const response = await api.get(`/loan-forecast/upload-history/${batchId}/forecast-data`);
    return response.data;
  },
  
  // Get processing status
  getProcessingStatus: async (batchId: string) => {
    const response = await api.get(`/loan-forecast/status/${batchId}`);
    return response.data;
  },
  
  // Health check
  healthCheck: async () => {
    const response = await api.get('/loan-forecast/ping');
    return response.data;
  },
  
  // Download forecast CSV file
  downloadForecastFile: (batchId: string) => {
    return `${API_BASE_URL}/loan-forecast/download/${batchId}`;
  },
};

// For backward compatibility, keep the old API name
export const dataIngestionAPI = loanForecastAPI;

export default api; 