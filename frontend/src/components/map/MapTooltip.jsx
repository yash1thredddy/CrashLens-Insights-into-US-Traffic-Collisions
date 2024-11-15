import React from 'react';
import { Box, Typography } from '@mui/material';

const MapTooltip = ({ info }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: info.x + 10,
        top: info.y + 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '10px',
        borderRadius: '4px',
        color: 'white',
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      <Typography variant="body2">
        {info.state}
      </Typography>
      <Typography variant="body2">
        Accidents: {info.count.toLocaleString()}
      </Typography>
    </Box>
  );
};

export default MapTooltip;