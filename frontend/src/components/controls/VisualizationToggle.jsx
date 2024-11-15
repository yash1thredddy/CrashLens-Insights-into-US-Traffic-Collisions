// src/components/controls/VisualizationToggle.jsx
import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

const VisualizationToggle = ({ visualizationType, onChange }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 340, // Position it next to the TimeFilter
        top: 20,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        p: 1,
        borderRadius: 1,
        zIndex: 1
      }}
    >
      <ToggleButtonGroup
        value={visualizationType}
        exclusive
        onChange={(_, newValue) => {
          if (newValue) onChange(newValue);
        }}
        sx={{
          '& .MuiToggleButton-root': {
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            minWidth: '100px',
            '&.Mui-selected': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              }
            },
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }
          }
        }}
      >
        <ToggleButton value="hexagon">
          Hexagon
        </ToggleButton>
        <ToggleButton value="heatmap">
          Heatmap
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default VisualizationToggle;