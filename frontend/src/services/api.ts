import { UploadHistory, DataIngestionResponse, LoanForecastData } from '../types/loan';
import { localStorageService } from './localStorage';
import { csvProcessor } from './csvProcessor';

// 模拟延迟以提供更好的用户体验
const simulateProcessing = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const loanForecastAPI = {
  // 上传CSV文件
  async uploadCSV(file: File, startMonth: string): Promise<DataIngestionResponse> {
    try {
      // 创建初始上传记录
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

      // 保存初始记录
      localStorageService.addUploadHistory(initialUpload);

      // 模拟处理延迟
      await simulateProcessing(2000);

      // 处理CSV文件，使用相同的batchId
      const result = await csvProcessor.processUploadWithBatchId(file, startMonth, batchId);

      // 更新上传记录
      const updatedUpload: UploadHistory = {
        ...initialUpload,
        uploadStatus: result.status,
        totalRecords: result.totalRecords,
        processedRecords: result.processedRecords,
        failedRecords: result.failedRecords,
        csvUrl: result.csvUrl
      };

      localStorageService.updateUploadStatus(batchId, result.status, result.csvUrl);

      // 保存预测数据
      if (result.loanForecasts && result.loanForecasts.length > 0) {
        localStorageService.saveForecastData(batchId, result.loanForecasts);
      }

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error('Upload failed: Processing error');
    }
  },

  // 获取上传历史
  async getUploadHistory(): Promise<UploadHistory[]> {
    try {
      // 模拟网络延迟
      await simulateProcessing(500);
      return localStorageService.getUploadHistory();
    } catch (error) {
      console.error('Error fetching upload history:', error);
      return [];
    }
  },

  // 获取最新的成功上传
  async getLatestSuccessfulUpload(): Promise<UploadHistory | null> {
    try {
      // 模拟网络延迟
      await simulateProcessing(300);
      return localStorageService.getLatestSuccessfulUpload();
    } catch (error) {
      console.error('Error fetching latest upload:', error);
      return null;
    }
  },

  // 删除上传历史
  async deleteUploadHistory(batchId: string): Promise<void> {
    try {
      // 模拟网络延迟
      await simulateProcessing(500);
      localStorageService.deleteUploadHistory(batchId);
    } catch (error) {
      console.error('Error deleting upload history:', error);
      throw new Error('Failed to delete upload history');
    }
  },

  // 获取预测数据
  async getForecastData(batchId: string): Promise<LoanForecastData[]> {
    try {
      // 模拟网络延迟
      await simulateProcessing(300);
      return localStorageService.getForecastData(batchId);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      return [];
    }
  },

  // 下载预测CSV
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

      // 获取预测数据
      const forecastData = localStorageService.getForecastData(batchId);
      console.log('Forecast data:', forecastData);
      
      if (!forecastData || forecastData.length === 0) {
        throw new Error('Forecast data not found');
      }
      
      // 生成CSV URL
      const csvUrl = csvProcessor.generateForecastCsv(forecastData, upload.originalFilename);
      console.log('Generated CSV URL:', csvUrl);
      
      // 更新localStorage中的csvUrl
      localStorageService.updateUploadStatus(batchId, upload.uploadStatus, csvUrl);
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = csvUrl;
      link.download = `${upload.originalFilename.replace(/\.[^.]*$/, '')}_forecast.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Download link clicked successfully');

      // 清理URL对象
      setTimeout(() => {
        URL.revokeObjectURL(csvUrl);
      }, 1000);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw new Error('Failed to download CSV file');
    }
  },

  // 健康检查（模拟）
  async ping(): Promise<string> {
    await simulateProcessing(100);
    return 'Pong';
  }
};

// For backward compatibility, keep the old API name
export const dataIngestionAPI = loanForecastAPI; 