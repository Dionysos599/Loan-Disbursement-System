import React, { useState, useEffect } from 'react';
import { Alert } from '@mui/material';
import Layout from './components/Layout';
import PortfolioDashboard from './components/PortfolioDashboard';
import LoanList from './components/LoanList';
import LoanDetails from './components/LoanDetails';
import DataUpload from './components/DataUpload';
import ForecastVisualization from './components/ForecastVisualization';
import { Loan } from './types/loan';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<any>(null);

  // Mock data for demonstration - in a real app, this would come from an API
  useEffect(() => {
    // Simulate loading loans from API
    setLoading(true);
    setTimeout(() => {
      const mockLoans: Loan[] = [
        {
          loanId: 'LOAN-001',
          customerName: 'ABC Construction Co.',
          loanAmount: 2500000,
          startDate: '2024-01-15',
          maturityDate: '2025-01-15',
          propertyType: 'Construction',
          currentProgress: {
            percentComplete: 0.35,
            outstandingBalance: 875000,
            asOfDate: '2024-07-01',
          },
        },
        {
          loanId: 'LOAN-002',
          customerName: 'Metro Apartments LLC',
          loanAmount: 1800000,
          startDate: '2024-03-01',
          maturityDate: '2026-03-01',
          propertyType: 'Multifamily',
          currentProgress: {
            percentComplete: 0.65,
            outstandingBalance: 630000,
            asOfDate: '2024-07-01',
          },
        },
        {
          loanId: 'LOAN-003',
          customerName: 'Downtown Office Partners',
          loanAmount: 5000000,
          startDate: '2024-02-01',
          maturityDate: '2027-02-01',
          extendedDate: '2027-08-01',
          propertyType: 'CRE',
          currentProgress: {
            percentComplete: 0.25,
            outstandingBalance: 3750000,
            asOfDate: '2024-07-01',
          },
        },
      ];
      setLoans(mockLoans);
      setLoading(false);
    }, 1000);
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedLoanId(null);
    if (page !== 'forecast') {
      setForecastData(null);
    }
  };

  const handleViewLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentPage('loan-details');
  };

  const handleForecastGenerated = (data: any) => {
    setForecastData(data);
    setCurrentPage('forecast');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PortfolioDashboard />;
      case 'portfolio':
        return <PortfolioDashboard />;
      case 'loans':
        return (
          <LoanList
            loans={loans}
            loading={loading}
            error={error}
            onViewLoan={handleViewLoan}
          />
        );
      case 'loan-details':
        return selectedLoanId ? (
          <LoanDetails loanId={selectedLoanId} />
        ) : (
          <Alert severity="warning">No loan selected</Alert>
        );
      case 'upload':
        return <DataUpload onForecastGenerated={handleForecastGenerated} />;
      case 'forecast':
        return forecastData ? (
          <ForecastVisualization forecastData={forecastData} />
        ) : (
          <Alert severity="warning">No forecast data available. Please upload data first.</Alert>
        );
      default:
        return <PortfolioDashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

export default App;
