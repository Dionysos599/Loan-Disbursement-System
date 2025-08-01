import { UploadHistory, LoanForecastData } from '../types/loan';

const STORAGE_KEYS = {
  UPLOAD_HISTORY: 'loan_forecast_upload_history',
  FORECAST_DATA: 'loan_forecast_data_'
};

export class LocalStorageService {
  // 获取所有上传历史
  getUploadHistory(): UploadHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.UPLOAD_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading upload history from localStorage:', error);
      return [];
    }
  }

  // 保存上传历史
  saveUploadHistory(history: UploadHistory[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UPLOAD_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving upload history to localStorage:', error);
    }
  }

  // 添加新的上传记录
  addUploadHistory(upload: UploadHistory): void {
    const history = this.getUploadHistory();
    history.unshift(upload); // 添加到开头
    this.saveUploadHistory(history);
  }

  // 更新上传记录状态
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

  // 删除上传记录
  deleteUploadHistory(batchId: string): void {
    const history = this.getUploadHistory();
    const filteredHistory = history.filter(item => item.batchId !== batchId);
    this.saveUploadHistory(filteredHistory);
    
    // 同时删除相关的预测数据
    this.deleteForecastData(batchId);
  }

  // 获取特定批次的预测数据
  getForecastData(batchId: string): LoanForecastData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FORECAST_DATA + batchId);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading forecast data from localStorage:', error);
      return [];
    }
  }

  // 保存预测数据
  saveForecastData(batchId: string, forecastData: LoanForecastData[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FORECAST_DATA + batchId, JSON.stringify(forecastData));
    } catch (error) {
      console.error('Error saving forecast data to localStorage:', error);
    }
  }

  // 删除预测数据
  deleteForecastData(batchId: string): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.FORECAST_DATA + batchId);
    } catch (error) {
      console.error('Error deleting forecast data from localStorage:', error);
    }
  }

  // 获取最新的成功上传
  getLatestSuccessfulUpload(): UploadHistory | null {
    const history = this.getUploadHistory();
    return history.find(item => item.uploadStatus === 'SUCCESS') || null;
  }

  // 清理过期的数据（可选，用于管理存储空间）
  cleanupOldData(maxAgeInDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    const history = this.getUploadHistory();
    const filteredHistory = history.filter(item => {
      const uploadDate = new Date(item.uploadedAt);
      return uploadDate > cutoffDate;
    });

    // 删除过期的预测数据
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

  // 获取存储使用情况
  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      const used = new Blob([JSON.stringify(localStorage)]).size;
      const total = 5 * 1024 * 1024; // 5MB (典型localStorage限制)
      const percentage = (used / total) * 100;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

// 导出单例实例
export const localStorageService = new LocalStorageService(); 