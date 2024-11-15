import React from 'react';
import { Alert, Box } from '@mui/material';

export const Error = ({ message }) => (
  <Box sx={{ p: 2 }}>
    <Alert severity="error">{message}</Alert>
  </Box>
);