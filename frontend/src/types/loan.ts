// 简化的类型定义 - 只保留系统实际使用的类型

export interface LoanForecastData {
  loanNumber: string;
  customerName: string;
  loanAmount: number;
  forecastData: Record<string, number>;
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
}

export interface DataIngestionResponse {
  batchId: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  message: string;
  loanForecasts: LoanForecastData[];
} 