import React, { useState } from 'react';
import './App.css';
import DataUpload from './components/DataUpload';

interface DataUploadProps {
  onForecastDataGenerated?: (data: any) => void;
}

function App() {
  return (
    <div className="App">
      <DataUpload />
    </div>
  );
}

export default App;
