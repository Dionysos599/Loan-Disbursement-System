import React from 'react';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import PortfolioDashboard from './PortfolioDashboard';

interface DashboardModalProps {
  batchId: string;
  open: boolean;
  onClose: () => void;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ batchId, open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <Box sx={{ position: 'absolute', right: 24, top: 24 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 4, minHeight: 400 }}>
        <PortfolioDashboard batchId={batchId} open={open} onClose={onClose} />
      </Box>
    </Dialog>
  );
};

export default DashboardModal; 