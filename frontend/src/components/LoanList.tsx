import React, { useState } from 'react';
import {
  Typography,
  Box,
  LinearProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Search, FilterList, Visibility } from '@mui/icons-material';
import dayjs from 'dayjs';
import { Loan } from '../types/loan';

interface LoanListProps {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  onViewLoan: (loanId: string) => void;
}

const LoanList: React.FC<LoanListProps> = ({ loans, loading, error, onViewLoan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('customerName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const propertyTypes = Array.from(new Set(loans.map(loan => loan.propertyType).filter(Boolean)));

  const filteredAndSortedLoans = loans
    .filter(loan => {
      const matchesSearch = 
        loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = propertyTypeFilter === 'all' || loan.propertyType === propertyTypeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'customerName':
          aValue = a.customerName;
          bValue = b.customerName;
          break;
        case 'loanAmount':
          aValue = a.loanAmount;
          bValue = b.loanAmount;
          break;
        case 'startDate':
          aValue = dayjs(a.startDate);
          bValue = dayjs(b.startDate);
          break;
        case 'maturityDate':
          aValue = dayjs(a.maturityDate);
          bValue = dayjs(b.maturityDate);
          break;
        default:
          aValue = a.customerName;
          bValue = b.customerName;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getProgressColor = (progress?: number) => {
    if (!progress) return 'default';
    if (progress >= 0.8) return 'success';
    if (progress >= 0.5) return 'warning';
    return 'error';
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Loan Portfolio
      </Typography>

      {/* Search and Filter Controls */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ width: { xs: '100%', md: '48%' } }}>
          <TextField
            fullWidth
            placeholder="Search by customer name or loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box sx={{ width: { xs: '100%', md: '25%' } }}>
          <FormControl fullWidth>
            <InputLabel>Property Type</InputLabel>
            <Select
              value={propertyTypeFilter}
              label="Property Type"
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              {propertyTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ width: { xs: '100%', md: '25%' } }}>
          <Box display="flex" gap={1}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => handleSort(e.target.value)}
              >
                <MenuItem value="customerName">Customer Name</MenuItem>
                <MenuItem value="loanAmount">Loan Amount</MenuItem>
                <MenuItem value="startDate">Start Date</MenuItem>
                <MenuItem value="maturityDate">Maturity Date</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              color={sortOrder === 'desc' ? 'primary' : 'default'}
            >
              <FilterList />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Results Summary */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          Showing {filteredAndSortedLoans.length} of {loans.length} loans
        </Typography>
      </Box>

      {/* Loans Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Loan ID</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Property Type</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Maturity Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedLoans.map((loan) => (
              <TableRow key={loan.loanId} hover>
                <TableCell>
                  <Typography variant="subtitle2">{loan.customerName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {loan.loanId}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2">
                    ${loan.loanAmount.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={loan.propertyType || 'Unknown'} 
                    size="small"
                    color="secondary"
                  />
                </TableCell>
                <TableCell>
                  {loan.currentProgress ? (
                    <Box>
                      <Typography variant="body2">
                        {(loan.currentProgress.percentComplete * 100).toFixed(1)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={loan.currentProgress.percentComplete * 100}
                        sx={{ height: 4, borderRadius: 2 }}
                        color={getProgressColor(loan.currentProgress.percentComplete) as any}
                      />
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No data
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {dayjs(loan.startDate).format('MMM DD, YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {dayjs(loan.maturityDate).format('MMM DD, YYYY')}
                  </Typography>
                  {loan.extendedDate && (
                    <Typography variant="caption" color="warning.main" display="block">
                      Extended: {dayjs(loan.extendedDate).format('MMM DD, YYYY')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onViewLoan(loan.loanId)}
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredAndSortedLoans.length === 0 && (
        <Box textAlign="center" sx={{ py: 4 }}>
          <Typography variant="h6" color="textSecondary">
            No loans found matching your criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LoanList; 