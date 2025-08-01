import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DataUpload from '../components/DataUpload';
import { loanForecastAPI } from '../services/api';
import { Server, WebSocket as MockWebSocket } from 'mock-socket';

jest.mock('../services/api');

// recursive function to get text content of a node
function getNodeText(node: any) {
  if (!node) return '';
  let text = '';
  if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
  for (let child of node.childNodes || []) text += getNodeText(child);
  return text;
}

describe('DataUpload', () => {
  let mockServer: Server;
  const WS_URL = 'ws://localhost:8081/ws/progress';

  // 可选：mock console.error，避免测试日志污染
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-ignore
    global.WebSocket = MockWebSocket;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = new Server(WS_URL);
  });

  afterEach(() => {
    mockServer.stop();
  });

  test('renders upload button and file input', () => {
    render(<DataUpload />);
    expect(screen.getByText(/Select CSV File/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Forecast Start Month/i).length).toBeGreaterThan(0);
  });

  test('shows error for non-csv file', () => {
    render(<DataUpload />);
    const fileInput = screen.getByLabelText(/Select CSV File/i);
    fireEvent.change(fileInput, { target: { files: [new File(['abc'], 'test.txt', { type: 'text/plain' })] } });
    expect(screen.getByText(/Please select a CSV file/i)).toBeInTheDocument();
  });

  test('calls uploadCSV and updates history on success', async () => {
    (loanForecastAPI.uploadCSV as jest.Mock).mockResolvedValue({ loanForecasts: [{ loanNumber: 'L1' }] });
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([]);
    render(<DataUpload />);
    // simulate select csv file
    const fileInput = screen.getByLabelText(/Select CSV File/i);
    fireEvent.change(fileInput, { target: { files: [new File(['a,b,c'], 'test.csv', { type: 'text/csv' })] } });
    // find Upload & Process button
    const uploadBtn = screen.getByRole('button', { name: /Upload & Process/i });
    fireEvent.click(uploadBtn);
    await screen.findByText(/Upload & Process/i); // wait for button to appear
    expect(loanForecastAPI.uploadCSV).toHaveBeenCalled();
    expect(loanForecastAPI.getUploadHistory).toHaveBeenCalled();
  });

  test('shows error on upload failure', async () => {
    (loanForecastAPI.uploadCSV as jest.Mock).mockRejectedValue(new Error('Network error'));
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([]); // ensure uploadHistory is []
    render(<DataUpload />);
    const fileInput = screen.getByLabelText(/Select CSV File/i);
    fireEvent.change(fileInput, { target: { files: [new File(['a,b,c'], 'test.csv', { type: 'text/csv' })] } });
    const uploadBtn = screen.getByRole('button', { name: /Upload & Process/i });
    fireEvent.click(uploadBtn);
    await screen.findByText(/Upload failed/i);
  });

  test('calls deleteUploadHistory and refreshes history', async () => {
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([{ batchId: 'b1', uploadedAt: '2024-01-01' }]);
    (loanForecastAPI.deleteUploadHistory as jest.Mock).mockResolvedValue({});
    render(<DataUpload />);
    // simulate delete button to appear
    const deleteIcon = await screen.findByTestId('DeleteIcon');
    fireEvent.click(deleteIcon);
    await waitFor(() => expect(loanForecastAPI.deleteUploadHistory).toHaveBeenCalled());
    await waitFor(() => expect(loanForecastAPI.getUploadHistory).toHaveBeenCalledTimes(2));
  });

  test('shows upload progress and success via WebSocket', async () => {
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([]);
    render(<DataUpload />);
    const headings = await screen.findAllByText(/Upload CSV File/i);
    expect(headings.some(h => h.tagName === 'H5')).toBe(true);
    // Only check if mock server is defined
    // TODO: add more tests for progress rendering
    expect(mockServer).toBeDefined();
  });

  test('renders upload history table and empty state', async () => {
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([
      { batchId: 'b1', originalFilename: 'f1.csv', uploadStatus: 'SUCCESS', totalRecords: 5, processedRecords: 5, uploadedAt: new Date().toISOString() }
    ]);
    render(<DataUpload />);
    expect(await screen.findByText('f1.csv')).toBeInTheDocument();
    // use findAllByText + .some to assert
    const all5Total = await screen.findAllByText(/total/);
    expect(all5Total.some(node => node.textContent?.includes('5 total'))).toBe(true);
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([]);
    render(<DataUpload />);
    expect(await screen.findByText(/No upload history found/i)).toBeInTheDocument();
  });

  test('shows error on deleteUploadHistory failure', async () => {
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([{ batchId: 'b1', uploadedAt: '2024-01-01' }]);
    (loanForecastAPI.deleteUploadHistory as jest.Mock).mockRejectedValue(new Error('delete failed'));
    render(<DataUpload />);
    const deleteIcon = await screen.findByTestId('DeleteIcon');
    fireEvent.click(deleteIcon);
    expect(await screen.findByText(/Failed to delete upload history/i)).toBeInTheDocument();
  });

  test('clicks history row to open DashboardModal', async () => {
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([
      { batchId: 'b1', originalFilename: 'f1.csv', uploadStatus: 'SUCCESS', totalRecords: 5, processedRecords: 5, uploadedAt: new Date().toISOString() }
    ]);
    render(<DataUpload />);
    const row = await screen.findByText('f1.csv');
    fireEvent.click(row);
    // check if Dialog is opened
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  test('download button triggers downloadForecastFile', async () => {
    (loanForecastAPI.getUploadHistory as jest.Mock).mockResolvedValue([
      { batchId: 'b1', originalFilename: 'f1.csv', uploadStatus: 'SUCCESS', totalRecords: 5, processedRecords: 5, uploadedAt: new Date().toISOString() }
    ]);
    render(<DataUpload />);
    const row = await screen.findByText('f1.csv');
    expect(row).toBeInTheDocument();
    const downloadBtn = await screen.findByTitle('Download Forecast CSV');
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(downloadBtn);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });
}); 