import React, { useState, useCallback } from 'react';

import { Box, Button, Typography } from '@mui/material';
import { Square } from 'lucide-react';

const AreaSelector = ({ onSelect, onClear }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState(null);

  const handleClick = useCallback((event) => {
    if (!isSelecting) return;

    if (!startPoint) {
      setStartPoint(event.lngLat);
    } else {
      // Create bounds from the two points
      const bounds = {
        minLng: Math.min(startPoint.lng, event.lngLat.lng),
        maxLng: Math.max(startPoint.lng, event.lngLat.lng),
        minLat: Math.min(startPoint.lat, event.lngLat.lat),
        maxLat: Math.max(startPoint.lat, event.lngLat.lat)
      };

      setStartPoint(null);
      setIsSelecting(false);
      onSelect(bounds);
    }
  }, [isSelecting, startPoint, onSelect]);

  const handleClear = useCallback(() => {
    setStartPoint(null);
    setIsSelecting(false);
    onClear();
  }, [onClear]);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 20,
        bottom: 100,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        p: 2,
        borderRadius: 1,
        zIndex: 1000,
        width: 250
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Area Selection
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          variant="contained"
          startIcon={<Square size={16} />}
          onClick={() => setIsSelecting(true)}
          disabled={isSelecting}
          sx={{
            bgcolor: isSelecting ? 'primary.dark' : 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          {isSelecting ? 'Click to Set Points' : 'Select Area'}
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            '&:hover': {
              borderColor: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Clear
        </Button>
      </Box>
      {isSelecting && !startPoint && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.7)' }}>
          Click to set first point
        </Typography>
      )}
      {isSelecting && startPoint && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.7)' }}>
          Click to set second point
        </Typography>
      )}
    </Box>
  );
};

export default AreaSelector;