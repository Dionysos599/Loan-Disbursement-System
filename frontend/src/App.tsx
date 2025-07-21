import React, { useState, useEffect } from 'react';
import { Alert } from '@mui/material';
import Layout from './components/Layout';
import PortfolioDashboard from './components/PortfolioDashboard';
import DataUpload from './components/DataUpload';
import ForecastVisualization from './components/ForecastVisualization';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [forecastData, setForecastData] = useState<any>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // 不再清空forecastData，保持数据持久性
  };

  const handleForecastGenerated = (data: any) => {
    setForecastData(data);
    setCurrentPage('forecast');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PortfolioDashboard forecastData={forecastData} />;
      case 'upload':
        return <DataUpload onForecastGenerated={handleForecastGenerated} />;
      case 'forecast':
        return (
          <ForecastVisualization 
            forecastData={forecastData} 
            onForecastDataLoaded={setForecastData}
          />
        );
      default:
        return <PortfolioDashboard forecastData={forecastData} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

export default App;
