// src/components/filters/ViewControls.jsx
import React from 'react';
import { 
  Box, 
  FormControl, 
  FormControlLabel, 
  Switch, 
  Typography,
  Slider 
} from '@mui/material';

const ViewControls = ({ 
  settings, 
  onSettingChange 
}) => {
  const {
    showHeatmap,
    heatmapIntensity,
    showPoints,
    pointRadius,
    elevationScale
  } = settings;

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 20,
        top: 250, // Below MapControls
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: 1,
        p: 2,
        width: 250
      }}
    >
      <Typography variant="h6" gutterBottom>
        View Settings
      </Typography>

      {/* Layer Toggles */}
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <FormControlLabel
          control={
            <Switch
              checked={showHeatmap}
              onChange={(e) => onSettingChange('showHeatmap', e.target.checked)}
            />
          }
          label="Heatmap"
        />
        
        {showHeatmap && (
          <Box sx={{ px: 2, mb: 2 }}>
            <Typography gutterBottom>Intensity</Typography>
            <Slider
              value={heatmapIntensity}
              min={0.1}
              max={2}
              step={0.1}
              onChange={(_, value) => onSettingChange('heatmapIntensity', value)}
            />
          </Box>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={showPoints}
              onChange={(e) => onSettingChange('showPoints', e.target.checked)}
            />
          }
          label="Points"
        />
        
        {showPoints && (
          <Box sx={{ px: 2, mb: 2 }}>
            <Typography gutterBottom>Point Size</Typography>
            <Slider
              value={pointRadius}
              min={1}
              max={20}
              step={1}
              onChange={(_, value) => onSettingChange('pointRadius', value)}
            />
          </Box>
        )}

        {/* 3D Controls */}
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Elevation Scale</Typography>
          <Slider
            value={elevationScale}
            min={0}
            max={200}
            step={10}
            onChange={(_, value) => onSettingChange('elevationScale', value)}
          />
        </Box>
      </FormControl>
    </Box>
  );
};

export default ViewControls;