import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs, { Dayjs } from 'dayjs';
import { Loan } from '../types/loan';
import { loanApi } from '../services/api';

interface LoanDetailsProps {
  loanId: string;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ loanId }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false);
  const [extendMaturityOpen, setExtendMaturityOpen] = useState(false);
  const [progressData, setProgressData] = useState({
    percentComplete: 0,
    outstandingBalance: 0,
    asOfDate: dayjs(),
  });
  const [newMaturityDate, setNewMaturityDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      setLoading(true);
      const data = await loanApi.getLoanDetails(loanId);
      setLoan(data);
      setError(null);
    } catch (err) {
      setError('Failed to load loan details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    try {
      const request = {
        percentComplete: progressData.percentComplete,
        outstandingBalance: progressData.outstandingBalance,
        asOfDate: progressData.asOfDate.format('YYYY-MM-DD'),
      };
      const updatedLoan = await loanApi.updateProgress(loanId, request);
      setLoan(updatedLoan);
      setUpdateProgressOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to update progress');
      console.error(err);
    }
  };

  const handleExtendMaturity = async () => {
    if (!newMaturityDate) return;
    
    try {
      const request = {
        newMaturityDate: newMaturityDate.format('YYYY-MM-DD'),
      };
      const updatedLoan = await loanApi.extendMaturity(loanId, request);
      setLoan(updatedLoan);
      setExtendMaturityOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to extend maturity');
      console.error(err);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!loan) {
    return <Alert severity="warning">Loan not found</Alert>;
  }

  const chartData = loan.schedule?.map(item => ({
    month: dayjs(item.month).format('MMM YYYY'),
    cumulative: item.cumulativeAmount,
    monthly: item.monthlyAmount,
  })) || [];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Loan Header */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {loan.customerName}
                  </Typography>
                  <Typography variant="h6" color="textSecondary">
                    Loan ID: {loan.loanId}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h5" color="primary">
                    ${loan.loanAmount.toLocaleString()}
                  </Typography>
                  <Chip 
                    label={loan.propertyType || 'Unknown Type'} 
                    color="secondary" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Progress Information */}
        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Progress
              </Typography>
              {loan.currentProgress ? (
                <>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography>Completion</Typography>
                    <Typography variant="h6">
                      {(loan.currentProgress.percentComplete * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={loan.currentProgress.percentComplete * 100}
                    sx={{ height: 10, borderRadius: 5, mb: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Outstanding Balance: ${loan.currentProgress.outstandingBalance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    As of: {dayjs(loan.currentProgress.asOfDate).format('MMM DD, YYYY')}
                  </Typography>
                </>
              ) : (
                <Typography color="textSecondary">No progress data available</Typography>
              )}
              <Button 
                variant="outlined" 
                onClick={() => setUpdateProgressOpen(true)}
                sx={{ mt: 2 }}
              >
                Update Progress
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Loan Dates */}
        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loan Timeline
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Start Date</Typography>
                <Typography variant="body1">
                  {dayjs(loan.startDate).format('MMM DD, YYYY')}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">Maturity Date</Typography>
                <Typography variant="body1">
                  {dayjs(loan.maturityDate).format('MMM DD, YYYY')}
                </Typography>
              </Box>
              {loan.extendedDate && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">Extended Date</Typography>
                  <Typography variant="body1" color="warning.main">
                    {dayjs(loan.extendedDate).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              )}
              <Button 
                variant="outlined" 
                onClick={() => setExtendMaturityOpen(true)}
                sx={{ mt: 1 }}
              >
                Extend Maturity
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Charts */}
        {loan.schedule && loan.schedule.length > 0 && (
          <>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Cumulative Disbursement
                  </Typography>
                  <LineChart
                    xAxis={[{ data: chartData.map(d => d.month), scaleType: 'band' }]}
                    series={[
                      {
                        data: chartData.map(d => d.cumulative),
                        label: 'Cumulative Amount',
                      },
                    ]}
                    height={300}
                  />
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Disbursement
                  </Typography>
                  <BarChart
                    xAxis={[{ data: chartData.map(d => d.month), scaleType: 'band' }]}
                    series={[
                      {
                        data: chartData.map(d => d.monthly),
                        label: 'Monthly Amount',
                      },
                    ]}
                    height={300}
                  />
                </CardContent>
              </Card>
            </Box>

            {/* Schedule Table */}
            <Box sx={{ width: '100%' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Disbursement Schedule
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="right">Monthly Amount</TableCell>
                          <TableCell align="right">Cumulative Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loan.schedule.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{dayjs(item.month).format('MMM YYYY')}</TableCell>
                            <TableCell align="right">
                              ${item.monthlyAmount.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              ${item.cumulativeAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </Box>

      {/* Update Progress Dialog */}
      <Dialog open={updateProgressOpen} onClose={() => setUpdateProgressOpen(false)}>
        <DialogTitle>Update Project Progress</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Percent Complete (0-100)"
            type="number"
            value={progressData.percentComplete}
            onChange={(e) => setProgressData({
              ...progressData,
              percentComplete: parseFloat(e.target.value) || 0
            })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Outstanding Balance"
            type="number"
            value={progressData.outstandingBalance}
            onChange={(e) => setProgressData({
              ...progressData,
              outstandingBalance: parseFloat(e.target.value) || 0
            })}
            sx={{ mb: 2 }}
          />
          <DatePicker
            label="As of Date"
            value={progressData.asOfDate}
            onChange={(date) => setProgressData({
              ...progressData,
              asOfDate: date || dayjs()
            })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateProgressOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProgress} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Extend Maturity Dialog */}
      <Dialog open={extendMaturityOpen} onClose={() => setExtendMaturityOpen(false)}>
        <DialogTitle>Extend Maturity Date</DialogTitle>
        <DialogContent>
          <DatePicker
            label="New Maturity Date"
            value={newMaturityDate}
            onChange={setNewMaturityDate}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendMaturityOpen(false)}>Cancel</Button>
          <Button onClick={handleExtendMaturity} variant="contained">Extend</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanDetails; 