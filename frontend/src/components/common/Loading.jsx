// src/components/common/Loading.jsx
import React from 'react';
import { CircularProgress, Box } from '@mui/material';

export const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);