// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

// File Upload Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['.csv', '.xlsx', '.xls'];

// WebSocket Configuration
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8081/ws';

// UI Constants
export const UPLOAD_STATUS = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

export const CHART_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#2e7d32',
  WARNING: '#ed6c02',
  ERROR: '#d32f2f'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB',
  INVALID_FILE_TYPE: 'Please upload a valid CSV or Excel file',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PROCESSING_ERROR: 'Error processing file. Please try again.'
} as const; 