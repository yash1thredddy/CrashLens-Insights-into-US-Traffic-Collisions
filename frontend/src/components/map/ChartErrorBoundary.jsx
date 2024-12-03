import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 3,
            borderRadius: 2,
            textAlign: 'center'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Error Loading Chart
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry?.();
            }}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ChartErrorBoundary;