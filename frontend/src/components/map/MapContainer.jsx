import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { HexagonLayer, HeatmapLayer, ContourLayer } from '@deck.gl/aggregation-layers';
import TopAccidentsChart from './TopAccidentsChart';
import { GeoJsonLayer } from '@deck.gl/layers';

import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import axios from 'axios';
import TimeFilter from '../filters/TimeFilter';
//import VisualizationToggle from '../controls/VisualizationToggle';
//import MapLegend from './MapLegend';
import { MAPBOX_TOKEN, INITIAL_VIEW_STATE, HEXAGON_LAYER_SETTINGS } from '../../constants';
import AreaSelector from './AreaSelector';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

function MapContainer({ onStateSelect }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartState, setChartState] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const areaRef = useRef(null); 
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    selectedYears: [2018],
    selectedMonths: [],
    selectedDays: [],
    visualizationType: 'hexagon',
    heightScale: HEXAGON_LAYER_SETTINGS.elevationScale,
    radius: HEXAGON_LAYER_SETTINGS.radius,
    coverage: HEXAGON_LAYER_SETTINGS.coverage,
    intensity: 1,
    cellSize: 8
  });

const [hoverInfo, setHoverInfo] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add filter parameters
      if (filters.selectedYears.length > 0) {
        filters.selectedYears.forEach((year) => params.append('years[]', year));
      }
      if (filters.selectedMonths.length > 0) {
        filters.selectedMonths.forEach((month) => params.append('months[]', month));
      }
      if (filters.selectedDays.length > 0) {
        filters.selectedDays.forEach((day) => params.append('days[]', day));
      }
 

      console.log('Fetching data with params:', params.toString());

      const response = await axios({
        method: 'get',
        url: `/api/spatial/map-data?${params}`,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.data.points) {
        throw new Error('Invalid data format received from server');
      }

      // Update the data state
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [
  filters.selectedYears,
  filters.selectedMonths,
  filters.selectedDays,
  
]);

  const handleAreaSelect = useCallback((bounds) => {
    setSelectedArea(bounds);
    // Update filters with the selected area
    setFilters(prev => ({
      ...prev,
      bounds: bounds
    }));
  }, []);

  const handleClearArea = useCallback(() => {
    setSelectedArea(null);
    // Remove bounds from filters
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters.bounds;
      return newFilters;
    });
  }, []);

  // If you have a selected area, create a GeoJSON layer for it
  const areaLayer = useMemo(() => {
    if (!selectedArea) return null;

    return new GeoJsonLayer({
      id: 'selected-area',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [selectedArea.minLng, selectedArea.minLat],
            [selectedArea.maxLng, selectedArea.minLat],
            [selectedArea.maxLng, selectedArea.maxLat],
            [selectedArea.minLng, selectedArea.maxLat],
            [selectedArea.minLng, selectedArea.minLat]
          ]]
        }
      },
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      getFillColor: [255, 255, 255, 20],
      getLineColor: [255, 255, 255, 80]
    });
  }, [selectedArea]);

const layers = useMemo(() => {
  if (!data?.points || data.points.length === 0) return [];

  const activeLayers = [];
  const commonProps = {
    data: data.points,
    getPosition: d => [d.lng, d.lat],
    pickable: true,
  };

  // Add visualization layer based on type
  switch (filters.visualizationType) {
    case 'hexagon':
      activeLayers.push(new HexagonLayer({
        ...commonProps,
        id: 'hexagon',
        getElevationWeight: d => d.severity,
        ...HEXAGON_LAYER_SETTINGS,
        elevationScale: filters.heightScale,
        radius: filters.radius,
        coverage: filters.coverage,
        autoHighlight: true,
        opacity: 0.8,
        extruded: true,
        colorRange: [
          [255, 255, 178],
          [254, 217, 118],
          [254, 178, 76],
          [253, 141, 60],
          [252, 78, 42],
          [227, 26, 28]
        ],
        onHover: (info) => {
          setHoverInfo(info.object ? {
            x: info.x,
            y: info.y,
            object: {
              count: info.object.points?.length || 0,
              avgSeverity: info.object.points?.length > 0 ? 
                (info.object.points.reduce((sum, p) => sum + (p.severity || 0), 0) / info.object.points.length).toFixed(2) : 0
            }
          } : null);
        }
      }));
      break;
    case 'heatmap':
      activeLayers.push(new HeatmapLayer({
        ...commonProps,
        id: 'heatmap',
        getWeight: d => d.severity,
        aggregation: 'SUM',
        radiusPixels: filters.cellSize * 10,
        intensity: filters.intensity,
        threshold: 0.05,
        colorRange: [
          [255, 255, 178],
          [254, 217, 118],
          [254, 178, 76],
          [253, 141, 60],
          [252, 78, 42],
          [227, 26, 28]
        ]
      }));
      break;
    case 'contour':
      activeLayers.push(new ContourLayer({
        ...commonProps,
        id: 'contour',
        contours: [{ threshold: 1, color: [255, 0, 0], strokeWidth: 2 }],
        cellSize: filters.cellSize * 10,
        getWeight: d => d.severity,
        opacity: 0.5
      }));
      break;
    default:
        activeLayers.push(new HexagonLayer({  // Use hexagon layer as default
          // ... hexagon layer props
        }));
        break;
  }

  // Add area selection layer if exists
  if (selectedArea) {
    activeLayers.push(areaLayer);
  }

  return activeLayers;
}, [data, filters, selectedArea, areaLayer, setHoverInfo]);
  




 


      
const renderHoverTooltip = () => {
  if (!hoverInfo?.object) return null;

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 1,
        pointerEvents: 'none',
        left: hoverInfo.x + 10,
        top: hoverInfo.y + 10,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '8px',
        borderRadius: '4px',
        color: '#fff'
      }}
    >
      <div>Points: {hoverInfo.object.count?.toLocaleString() || 'N/A'}</div>
      <div>Avg Severity: {hoverInfo.object.avgSeverity || 'N/A'}</div>
    </div>
  );
};

  
  const renderStatistics = () => {
    if (!data?.summary) return null;

    const formatNumber = (num) => {
      if (num === null || num === undefined) return 'N/A';
      return typeof num === 'number' ? num.toLocaleString() : num;
    };

    const formatDecimal = (num) => {
      if (num === null || num === undefined) return 'N/A';
      return typeof num === 'number' ? num.toFixed(2) : num;
    };

    return (
      
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 2,
          borderRadius: 1,
          zIndex: 1,
          minWidth: '300px',
          backdropFilter: 'blur(8px)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Accident Statistics
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Total Accidents:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatNumber(data.summary.total_accidents)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Average Severity:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatDecimal(data.summary.avg_severity)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              States Affected:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatNumber(data.summary.states_affected)}
            </Typography>
          </Box>

          {data.summary.common_weather && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Common Weather:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {data.summary.common_weather}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Time Range Coverage:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2">
                {formatNumber(data.summary.years_count)} years, {formatNumber(data.summary.months_count)} months
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Current View:
            </Typography>
            <Typography variant="body2">
              Showing {formatNumber(data.points.length)} accidents
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <DeckGL
        viewState={viewState}
        controller={{
          dragRotate: true,
          doubleClickZoom: true,
          touchZoom: true
        }}
        layers={layers}
        onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState)}
        onClick={(info, event) => {
          if (!event.lngLat) return;
          
          const mapClickEvent = {
            lngLat: {
              lng: event.lngLat[0],
              lat: event.lngLat[1]
            }
          };
          
          if (areaRef.current?.handleMapClick) {
            areaRef.current.handleMapClick(mapClickEvent);
          }
        }}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v10"
          reuseMaps
        />
      </DeckGL>
      {/* Add TopAccidentsChart here */}
      <Box sx={{ position: 'absolute', right: 20, top: 350, zIndex: 8 }}>
        <TopAccidentsChart 
          filters={filters}
          selectedState={chartState}
          onStateSelect={(state) => {
            setChartState(state);
            // Also update the main filters
            setFilters(prev => ({
              ...prev,
              state: state
            }));
          }}
        />
      </Box>
      <TimeFilter 
        filters={filters}
        onChange={setFilters}
      />

      
      {/* State Selection Controls */}
<Box
  sx={{
    position: 'absolute',
    top: 10,
    left: 360,
    bgcolor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    p: 2,
    borderRadius: 1,
    zIndex: 1,
    width: 250
  }}
>
  <FormControl fullWidth sx={{ mb: 2 }}>
    <InputLabel sx={{ color: 'white' }}>Select State</InputLabel>
    <Select
      value=""
      onChange={(e) => onStateSelect(e.target.value)}  // This handles map navigation
      sx={{
        color: 'white',
        '.MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(255, 255, 255, 0.5)'
        }
      }}
    >
      <MenuItem value="">United States</MenuItem>
      {US_STATES.map(state => (
        <MenuItem key={state} value={state}>{state}</MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>

      {renderHoverTooltip()}
      {renderStatistics()}

      {loading && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          bgcolor: 'rgba(0,0,0,0.8)',
          p: 2,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          zIndex: 1000
        }}>
          <CircularProgress size={24} color="inherit" />
          <Typography>Loading accident data...</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: 500,
          zIndex: 1000
        }}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              backgroundColor: 'rgba(211, 47, 47, 0.9)', 
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Layer Controls */}
<Box
  sx={{
    position: 'absolute',
    top: 320,
    left: 20,
    bgcolor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    p: 2,
    borderRadius: 1,
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  }}
>
  <Typography variant="subtitle2" gutterBottom>
    Visualization Type
  </Typography>
  <ToggleButtonGroup
    value={filters.visualizationType}
    exclusive
    onChange={(_, newValue) => {
      if (newValue) {
        setFilters(prev => ({
          ...prev,
          visualizationType: newValue
        }));
      }
    }}
    sx={{
      '& .MuiToggleButton-root': {
        color: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
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
    <ToggleButton value="hexagon">Hexagon</ToggleButton>
    <ToggleButton value="heatmap">Heatmap</ToggleButton>
   
  </ToggleButtonGroup>
</Box>




{filters.visualizationType === 'hexagon' && (
  <Box
    sx={{
      position: 'absolute',
      top: 450,
      left: 20,
      zIndex: 6,
      p: 5,
      bgcolor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: 1,
    }}
  >
    <Typography variant="subtitle2">Height Scale</Typography>
    <Slider
      value={filters.heightScale}
      min={100}
      max={10000}
      step={1}
      onChange={(event, newValue) => setFilters(prev => ({
        ...prev,
        heightScale: newValue
      }))}
      aria-labelledby="height-scale-slider"
    />
  </Box>
)}



      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 2,
          borderRadius: 1,
          zIndex: 1
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Accident Density
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 200,
              height: 20,
              background: 'linear-gradient(to right, #ffffb2, #fed976, #feb24c, #fd8d3c, #f03b20, #bd0026)'
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption">Low</Typography>
          <Typography variant="caption">High</Typography>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.7)' }}>
          {filters.visualizationType === 'hexagon' ? 
            'Height represents accident severity' : 
            'Color intensity represents accident density'}
        </Typography>
      </Box>

      {/* Data Count Indicator */}

    </Box>
  );
}


export default MapContainer;