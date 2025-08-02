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
      
      // Generate CSV content directly
      const csvContent = this.generateCsvContent(forecastData);
      console.log('Generated CSV content length:', csvContent.length);
      
      const filename = `${upload.originalFilename.replace(/\.[^.]*$/, '')}_forecast.csv`;
      console.log('Download filename:', filename);
      
      // Try to use Python backend API if available
      if (window.pywebview && window.pywebview.api) {
        try {
          console.log('Trying Python backend download API');
          const result = await window.pywebview.api.download_csv(csvContent, filename);
          
          if (result.success) {
            console.log('Python backend download successful:', result.message);
            alert(`Download successful!\n${result.message}`);
            return;
          } else {
            console.log('Python backend download failed:', result.message);
            throw new Error(result.message);
          }
        } catch (error) {
          console.log('Python backend API not available or failed:', error);
        }
      }
      
      // Fallback to browser methods if Python API is not available
      console.log('Falling back to browser download methods');
      
      // Method 1: Try Blob with createObjectURL
      try {
        console.log('Trying Method 1: Blob with createObjectURL');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);
        
        console.log('Method 1 completed successfully');
        return;
      } catch (error) {
        console.log('Method 1 failed:', error);
      }
      
      // Method 2: Try data URL
      try {
        console.log('Trying Method 2: Data URL');
        const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Method 2 completed successfully');
        return;
      } catch (error) {
        console.log('Method 2 failed:', error);
      }
      
      // Method 3: Try window.open
      try {
        console.log('Trying Method 3: window.open');
        const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        window.open(dataUrl, '_blank');
        
        console.log('Method 3 completed successfully');
        return;
      } catch (error) {
        console.log('Method 3 failed:', error);
      }
      
      // Method 4: Try clipboard copy
      try {
        console.log('Trying Method 4: Clipboard copy');
        await navigator.clipboard.writeText(csvContent);
        alert('CSV content copied to clipboard. Please paste it into a text file and save as .csv');
        console.log('Method 4 completed successfully');
        return;
      } catch (error) {
        console.log('Method 4 failed:', error);
      }
      
      throw new Error('All download methods failed');

    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Download failed: ' + (error instanceof Error ? error.message : String(error)));
      throw new Error('Failed to download CSV file');
    }
  },

  // Helper method to generate CSV content
  generateCsvContent(forecastDataList: LoanForecastData[]): string {
    // Get all months
    const allMonths = new Set<string>();
    for (const forecast of forecastDataList) {
      if (forecast.forecastData) {
        Object.keys(forecast.forecastData).forEach(month => allMonths.add(month));
      }
    }

    const months = Array.from(allMonths).sort((a, b) => {
      const dateA = new Date(`01-${a}`);
      const dateB = new Date(`01-${b}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Build CSV content
    const baseHeaders = [
      'Loan Number', 'Loan Amount', 'Maturity Date', 'Extended Date',
      'Outstanding Balance', 'Undisbursed Amount', '% of Completion'
    ];

    const headers = [...baseHeaders, ...months];
    const csvRows = [headers.join(',')];

    // Calculate column sums
    const columnSums: Record<string, number> = {};
    months.forEach(month => columnSums[month] = 0);

    // Add data rows
    for (const forecast of forecastDataList) {
      if (!forecast.loanNumber || forecast.loanNumber.trim() === '') {
        continue;
      }

      const row = [
        forecast.loanNumber,
        forecast.loanAmount !== undefined && forecast.loanAmount !== null ? forecast.loanAmount.toString() : '',
        forecast.maturityDate || '',
        forecast.extendedDate || '',
        forecast.outstandingBalance ?? '',
        forecast.undisbursedAmount ?? '',
        forecast.percentOfCompletion ?? ''
      ];

      // Add forecast data
      for (const month of months) {
        const amount = forecast.forecastData?.[month] ?? 0;
        row.push(amount.toString());
        columnSums[month] += amount;
      }

      csvRows.push(row.join(','));
    }

    // Add sum row
    const sumRow = ['SUM OF FORECAST'];
    for (let i = 1; i < baseHeaders.length; i++) {
      sumRow.push('');
    }

    for (const month of months) {
      const sum = columnSums[month];
      sumRow.push(sum.toString());
    }

    csvRows.push(sumRow.join(','));

    return csvRows.join('\n');
  },

  // Health check (simulated)
  async ping(): Promise<string> {
    await simulateProcessing(100);
    return 'Pong';
  }
};

// For backward compatibility, keep the old API name
export const dataIngestionAPI = loanForecastAPI; 