import React, { useState } from 'react';
import { Box } from '@mui/material';
import MapContainer from './components/map/MapContainer';
import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
  const [filters, setFilters] = useState({
    year: 2016,
    month: '',
    day: '',
    heightScale: 100,
    radius: 20000,
    visualizationType: 'hexagon'
  });

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', bgcolor: '#061428' }}>
      <MapContainer 
        filters={filters} 
        onFilterChange={setFilters} 
      />
    </Box>
  );
}

export default App;