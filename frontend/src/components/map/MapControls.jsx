// src/components/map/MapControls.jsx
import React from 'react';
import { Box, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { 
  ZoomIn, 
  ZoomOut, 
  Rotate90DegreesCcw, 
  ThreeDRotation,
  Map as MapIcon,
  Layers
} from '@mui/icons-material';
import { MAP_STYLES } from '../../constants';

const MapControls = ({ 
  viewport, 
  onViewportChange,
  mapStyle,
  onMapStyleChange
}) => {
  const handleZoom = (zoomIn) => {
    onViewportChange({
      ...viewport,
      zoom: viewport.zoom + (zoomIn ? 1 : -1)
    });
  };

  const handleRotate = () => {
    onViewportChange({
      ...viewport,
      bearing: (viewport.bearing + 45) % 360
    });
  };

  const handlePitch = () => {
    onViewportChange({
      ...viewport,
      pitch: viewport.pitch === 0 ? 45 : 0
    });
  };

  const handleMapStyle = (_, newStyle) => {
    if (newStyle !== null) {
      onMapStyleChange(newStyle);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 20,
        top: 20,
        zIndex: 1,
        backgroundColor: 'white',
        borderRadius: 1,
        boxShadow: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 1
      }}
    >
      {/* Map Style Controls */}
      <ToggleButtonGroup
        value={mapStyle}
        exclusive
        onChange={handleMapStyle}
        size="small"
        orientation="vertical"
      >
        <ToggleButton value={MAP_STYLES.MAPBOX} aria-label="mapbox">
          <MapIcon />
        </ToggleButton>
        <ToggleButton value={MAP_STYLES.OSM} aria-label="osm">
          <Layers />
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ height: 1, backgroundColor: 'grey.300', my: 1 }} />

      {/* Navigation Controls */}
      <IconButton onClick={() => handleZoom(true)} size="small">
        <ZoomIn />
      </IconButton>
      <IconButton onClick={() => handleZoom(false)} size="small">
        <ZoomOut />
      </IconButton>
      <IconButton onClick={handleRotate} size="small">
        <Rotate90DegreesCcw />
      </IconButton>
      <IconButton onClick={handlePitch} size="small">
        <ThreeDRotation />
      </IconButton>
    </Box>
  );
};

export default MapControls;