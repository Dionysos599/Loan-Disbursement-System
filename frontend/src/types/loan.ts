// Simplified type definitions - only keep the types actually used in the system

export interface LoanForecastData {
  loanNumber: string;
  customerName: string;
  loanAmount: number;
  propertyType?: string;
  city?: string;
  forecastData: Record<string, number>;
  totalForecastedAmount?: number;
  scenarioName?: string;
}

export interface UploadHistory {
  batchId: string;
  originalFilename: string;
  fileSize: number;
  uploadStatus: string;
  uploadedAt: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  originalFilePath?: string;
  forecastCsvPath?: string;
  csvUrl?: string; // 添加CSV下载链接
}

export interface DataIngestionResponse {
  batchId: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  message: string;
  loanForecasts: LoanForecastData[];
  csvUrl?: string; // 添加CSV下载链接
} 