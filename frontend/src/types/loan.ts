export interface Loan {
  loanId: string;
  customerName: string;
  loanAmount: number;
  startDate: string;
  maturityDate: string;
  extendedDate?: string;
  propertyType?: string;
  currentProgress?: Progress;
  schedule?: ScheduleItem[];
}

export interface Progress {
  percentComplete: number;
  outstandingBalance: number;
  asOfDate: string;
}

export interface ScheduleItem {
  month: string;
  cumulativeAmount: number;
  monthlyAmount: number;
}

export interface CalculateScheduleRequest {
  fromDate: string;
  toDate: string;
  currentComplete?: number;
}

export interface UpdateProgressRequest {
  percentComplete: number;
  outstandingBalance: number;
  asOfDate: string;
}

export interface ExtendMaturityRequest {
  newMaturityDate: string;
}

export interface PortfolioExposure {
  totalExposure: number;
  exposureByType: Record<string, number>;
  monthlyProjections: MonthlyProjection[];
}

export interface MonthlyProjection {
  month: string;
  totalExposure: number;
  constructionExposure: number;
  multifamilyExposure: number;
  creExposure: number;
} 