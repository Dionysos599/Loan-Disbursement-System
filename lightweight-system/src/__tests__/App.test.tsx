import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  test('renders main title', () => {
    render(<App />);
    expect(screen.getByText(/Loan Disbursement Forecast System/i)).toBeInTheDocument();
  });

  test('renders upload button', () => {
    render(<App />);
    expect(screen.getByText(/Select CSV File/i)).toBeInTheDocument();
  });

  test('renders forecast start month label', () => {
  render(<App />);
    expect(screen.getAllByText(/Forecast Start Month/i).length).toBeGreaterThan(0);
  });
});
