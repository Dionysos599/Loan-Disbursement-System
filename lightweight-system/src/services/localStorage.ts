import { UploadHistory, LoanForecastData } from '../types/loan';

const STORAGE_KEYS = {
  UPLOAD_HISTORY: 'loan_forecast_upload_history',
  FORECAST_DATA: 'loan_forecast_data_'
};

export class LocalStorageService {
  // Get all upload history
  getUploadHistory(): UploadHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading upload history from localStorage:', error);
      return [];
    }
  }

  // Save upload history
  saveUploadHistory(history: UploadHistory[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving upload history to localStorage:', error);
    }
  }

  // Add new upload record
  addUploadHistory(upload: UploadHistory): void {
    const history = this.getUploadHistory();
    history.unshift(upload); // Add to beginning
    this.saveUploadHistory(history);
  }

  // Update upload record status
  updateUploadStatus(batchId: string, status: string, csvUrl?: string): void {
    const history = this.getUploadHistory();
    const index = history.findIndex(item => item.batchId === batchId);
    if (index !== -1) {
      history[index].uploadStatus = status;
      if (csvUrl) {
        history[index].csvUrl = csvUrl;
      }
      this.saveUploadHistory(history);
    }
  }

  // Delete upload record
  deleteUploadHistory(batchId: string): void {
    const history = this.getUploadHistory();
    const filteredHistory = history.filter(item => item.batchId !== batchId);
    this.saveUploadHistory(filteredHistory);
    
    // Also delete related forecast data
    this.deleteForecastData(batchId);
  }

  // Get forecast data for specific batch
  getForecastData(batchId: string): LoanForecastData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FORECAST_DATA + batchId);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading forecast data from localStorage:', error);
      return [];
    }
  }

  // Save forecast data
  saveForecastData(batchId: string, forecastData: LoanForecastData[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FORECAST_DATA + batchId, JSON.stringify(forecastData));
    } catch (error) {
      console.error('Error saving forecast data to localStorage:', error);
    }
  }

  // Delete forecast data
  deleteForecastData(batchId: string): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.FORECAST_DATA + batchId);
    } catch (error) {
      console.error('Error deleting forecast data from localStorage:', error);
    }
  }

  // Get latest successful upload
  getLatestSuccessfulUpload(): UploadHistory | null {
    const history = this.getUploadHistory();
    return history.find(item => item.uploadStatus === 'SUCCESS') || null;
  }

  // Clean up expired data (optional, for storage management)
  cleanupOldData(maxAgeInDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    const history = this.getUploadHistory();
    const filteredHistory = history.filter(item => {
      const uploadDate = new Date(item.uploadedAt);
      return uploadDate > cutoffDate;
    });

    // Delete expired forecast data
    const expiredBatchIds = history
      .filter(item => {
        const uploadDate = new Date(item.uploadedAt);
        return uploadDate <= cutoffDate;
      })
      .map(item => item.batchId);

    expiredBatchIds.forEach(batchId => {
      this.deleteForecastData(batchId);
    });

    this.saveUploadHistory(filteredHistory);
  }

  // Get storage usage
  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      const used = new Blob([JSON.stringify(localStorage)]).size;
      const total = 5 * 1024 * 1024; // 5MB (typical localStorage limit)
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService(); 