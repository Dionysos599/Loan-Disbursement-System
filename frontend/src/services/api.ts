import axios from 'axios';
import { Loan, CalculateScheduleRequest, UpdateProgressRequest, ExtendMaturityRequest, PortfolioExposure } from '../types/loan';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 数据上传相关接口
export const dataIngestionAPI = {
  // 上传CSV文件
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
  
  // 获取上传历史列表
  getUploadHistory: async () => {
    const response = await api.get('/data-ingestion/upload-history');
    return response.data;
  },
  
  // 获取最新的成功上传
  getLatestSuccessfulUpload: async () => {
    const response = await api.get('/data-ingestion/upload-history/latest');
    return response.data;
  },
  
  // 删除上传历史
  deleteUploadHistory: async (batchId: string) => {
    const response = await api.delete(`/data-ingestion/upload-history/${batchId}`);
    return response.data;
  },
  
  // 获取特定批次的预测数据
  getForecastData: async (batchId: string) => {
    const response = await api.get(`/data-ingestion/upload-history/${batchId}/forecast-data`);
    return response.data;
  },
  
  // 获取处理状态
  getProcessingStatus: async (batchId: string) => {
    const response = await api.get(`/data-ingestion/status/${batchId}`);
    return response.data;
  },
  
  // 健康检查
  healthCheck: async () => {
    const response = await api.get('/data-ingestion/health');
    return response.data;
  },
};

// 预测服务相关接口
export const forecastingAPI = {
  // 生成预测
  generateForecast: async (data: any) => {
    const response = await api.post('/forecasting/forecast', data);
    return response.data;
  },
  
  // 健康检查
  healthCheck: async () => {
    const response = await api.get('/forecasting/health');
    return response.data;
  },
};

// 贷款管理相关接口
export const loanAPI = {
  // 获取贷款列表
  getLoans: async () => {
    const response = await api.get('/loans');
    return response.data;
  },
  
  // 获取单个贷款详情
  getLoanDetails: async (loanId: string) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },
  
  // 更新贷款进度
  updateLoanProgress: async (loanId: string, progressData: any) => {
    const response = await api.put(`/loans/${loanId}/progress`, progressData);
    return response.data;
  },
  
  // 计算还款计划
  calculateSchedule: async (loanId: string, scheduleData: any) => {
    const response = await api.post(`/loans/${loanId}/calculate-schedule`, scheduleData);
    return response.data;
  },
  
  // 获取组合风险敞口
  getPortfolioExposure: async () => {
    const response = await api.get('/portfolio/exposure');
    return response.data;
  },
};

export default api; 