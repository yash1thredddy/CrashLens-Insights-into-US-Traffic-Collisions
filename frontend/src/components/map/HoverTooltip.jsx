// src/components/map/HoverTooltip.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const HoverTooltip = ({ info }) => {
  if (!info.object) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: info.x + 10,
        top: info.y + 10,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        p: 1.5,
        borderRadius: 1,
        minWidth: 200,
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {info.object.points ? (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Cluster Information
          </Typography>
          <Typography variant="body2">
            Accidents: {info.object.points.length.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            Average Severity: {(info.object.points.reduce((acc, p) => acc + p.severity, 0) / info.object.points.length).toFixed(2)}
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Accident Details
          </Typography>
          <Typography variant="body2">
            Severity: {info.object.severity}
          </Typography>
          <Typography variant="body2">
            Weather: {info.object.weather_condition || 'Not available'}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default HoverTooltip;