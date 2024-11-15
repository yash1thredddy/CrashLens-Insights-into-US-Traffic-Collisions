import React from 'react';
import { Box, Typography } from '@mui/material';
import { HEXAGON_LAYER_SETTINGS } from '../../constants';

const MapLegend = () => {
  const { colorRange } = HEXAGON_LAYER_SETTINGS;

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 2,
        borderRadius: 1,
        boxShadow: 1,
        zIndex: 1,
        color: 'white',
        minWidth: '200px'
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Accident Density
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        {colorRange.map((color, i) => (
          <Box
            key={i}
            sx={{
              width: 30,
              height: 20,
              backgroundColor: `rgb(${color.join(',')})`,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption">Low</Typography>
        <Typography variant="caption">High</Typography>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" display="block" gutterBottom>
          Hexagon height represents accident severity
        </Typography>
        <Typography variant="caption" display="block">
          Color represents accident density
        </Typography>
      </Box>
    </Box>
  );
};

export default MapLegend;