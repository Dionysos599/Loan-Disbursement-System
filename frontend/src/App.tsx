import React, { useState } from 'react';
import './App.css';
import Layout from './components/Layout';
import DataUpload from './components/DataUpload';
import PortfolioDashboard from './components/PortfolioDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [forecastData, setForecastData] = useState<any>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleForecastDataGenerated = (data: any) => {
    setForecastData(data);
    setCurrentPage('dashboard'); // Navigate to dashboard instead of forecast
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PortfolioDashboard />;
      case 'upload':
        return <DataUpload onForecastDataGenerated={handleForecastDataGenerated} />;
      default:
        return <PortfolioDashboard />;
    }
  };

  return (
    <div className="App">
      <Layout onNavigate={handleNavigate} currentPage={currentPage}>
        {renderPage()}
    </Layout>
    </div>
  );
}

export default App;
