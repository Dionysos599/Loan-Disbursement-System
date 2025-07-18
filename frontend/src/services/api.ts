import axios from 'axios';
import { Loan, CalculateScheduleRequest, UpdateProgressRequest, ExtendMaturityRequest, PortfolioExposure } from '../types/loan';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Loan API functions
export const loanApi = {
  getLoanDetails: async (loanId: string): Promise<Loan> => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },

  calculateSchedule: async (loanId: string, request: CalculateScheduleRequest): Promise<Loan> => {
    const response = await api.post(`/loans/${loanId}/calculate-schedule`, request);
    return response.data;
  },

  updateProgress: async (loanId: string, request: UpdateProgressRequest): Promise<Loan> => {
    const response = await api.put(`/loans/${loanId}/progress`, request);
    return response.data;
  },

  extendMaturity: async (loanId: string, request: ExtendMaturityRequest): Promise<Loan> => {
    const response = await api.put(`/loans/${loanId}/extend`, request);
    return response.data;
  },
};

// Portfolio API functions
export const portfolioApi = {
  getExposure: async (): Promise<PortfolioExposure> => {
    const response = await api.get('/portfolio/exposure');
    return response.data;
  },
};

export default api; 