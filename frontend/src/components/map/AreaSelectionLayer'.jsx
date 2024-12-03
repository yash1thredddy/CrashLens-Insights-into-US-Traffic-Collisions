import React, { useState, useCallback } from 'react';
import { DrawRectangleMode } from '@deck.gl/core';
import { EditableGeoJsonLayer } from '@deck.gl/layers';
import { Box, Button, Typography } from '@mui/material';
import { Square } from 'lucide-react';

const AreaSelectionLayer = ({ onAreaSelect, onClearSelection }) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  const handleSelect = useCallback((feature) => {
    if (!feature) return;
    
    const [minLng, minLat] = feature.geometry.coordinates[0][0];
    const [maxLng, maxLat] = feature.geometry.coordinates[0][2];
    
    const bounds = {
      minLng,
      maxLng,
      minLat,
      maxLat
    };

    setSelectedFeature(feature);
    onAreaSelect(bounds);
    setIsSelecting(false);
  }, [onAreaSelect]);

  const handleClear = useCallback(() => {
    setSelectedFeature(null);
    setIsSelecting(false);
    onClearSelection();
  }, [onClearSelection]);

  const layer = new EditableGeoJsonLayer({
    id: 'area-selection-layer',
    data: selectedFeature ? {
      type: 'FeatureCollection',
      features: [selectedFeature]
    } : {
      type: 'FeatureCollection',
      features: []
    },
    mode: isSelecting ? DrawRectangleMode : null,
    selectedFeatureIndexes: [],
    getFillColor: [255, 255, 255, 20],
    getLineColor: [255, 255, 255, 80],
    lineWidthMinPixels: 2,
    editHandlePointRadiusMinPixels: 4,
    onEdit: ({ updatedData, editType }) => {
      if (editType === 'addFeature') {
        const feature = updatedData.features[0];
        handleSelect(feature);
      }
    }
  });

  return {
    layer,
    controls: (
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
            {isSelecting ? 'Drawing Area...' : 'Select Area'}
          </Button>
          {selectedFeature && (
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
          )}
        </Box>
        {isSelecting && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.7)' }}>
            Click and drag to draw a rectangle
          </Typography>
        )}
      </Box>
    )
  };
};

export default AreaSelectionLayer;