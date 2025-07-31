// Simplified type definitions - only keep the types actually used in the system

export interface LoanForecastData {
  loanNumber: string;
  customerName?: string;
  loanAmount: number;
  forecastData: Record<string, number>;
  totalForecastedAmount: number;
  scenarioName: string;
  maturityDate?: string;
  extendedDate?: string;
  outstandingBalance?: string;
  undisbursedAmount?: string;
  percentOfCompletion?: string;
  percentOfLoanDrawn?: string;
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
  csvUrl?: string; // Add CSV download link
}

export interface DataIngestionResponse {
  batchId: string;
  status: string;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  message: string;
  loanForecasts: LoanForecastData[];
  csvUrl?: string; // Add CSV download link
} 