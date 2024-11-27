import React, { useState } from 'react';
import { Box } from '@mui/material';
import MapContainer from './components/map/MapContainer';
import StateMapContainer from './components/map/StateMapContainer';
import 'mapbox-gl/dist/mapbox-gl.css';

function App() {
  // Keep your existing filters state
  const [filters, setFilters] = useState({
    year: 2016,
    month: '',
    day: '',
    heightScale: 100,
    radius: 20000,
    visualizationType: 'hexagon'
  });

  // Add state selection state
  const [selectedState, setSelectedState] = useState(null);

  // Handler for state selection
  const handleStateSelect = (state) => {
    setSelectedState(state);
  };

  // Handler for returning to national view
  const handleBackToNational = () => {
    setSelectedState(null);
  };

 return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', bgcolor: '#061428' }}>
      {selectedState ? (
        <StateMapContainer 
          stateName={selectedState}
          onBackToNational={() => setSelectedState(null)}
        />
      ) : (
        <MapContainer 
          onStateSelect={setSelectedState}
        />
      )}
    </Box>
  );
}

export default App;