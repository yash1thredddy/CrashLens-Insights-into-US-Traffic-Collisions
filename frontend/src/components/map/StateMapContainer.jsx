
import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, GeoJSON, TileLayer, ZoomControl } from 'react-leaflet';
import { 
  Box, 
  Typography, 
  Alert, 
  CircularProgress, 
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider
} from '@mui/material';
import axios from 'axios';
import TimeFilter from '../filters/TimeFilter';
import { scaleQuantize } from 'd3-scale';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// State center positions map
const STATE_CENTERS = {
  'AL': [32.7794, -86.8287],
  'AK': [64.0685, -152.2782],
  'AZ': [34.2744, -111.6602],
  'AR': [34.8938, -92.4426],
  'CA': [36.7783, -119.4179],
  'CO': [39.5501, -105.7821],
  'CT': [41.6032, -72.7266],
  'DE': [38.9108, -75.5277],
  'FL': [27.6648, -81.5158],
  'GA': [32.1656, -82.9001],
  'HI': [19.8968, -155.5828],
  'ID': [44.0682, -114.7420],
  'IL': [40.6331, -89.3985],
  'IN': [39.8494, -86.2583],
  'IA': [42.0115, -93.2105],
  'KS': [38.5266, -96.7265],
  'KY': [37.6681, -84.6701],
  'LA': [31.1695, -91.8678],
  'ME': [44.6939, -69.3819],
  'MD': [39.0639, -76.8021],
  'MA': [42.2302, -71.5301],
  'MI': [43.3266, -84.5361],
  'MN': [45.6945, -93.9002],
  'MS': [32.7416, -89.6787],
  'MO': [38.4561, -92.2884],
  'MT': [46.9219, -110.4544],
  'NE': [41.4925, -99.9018],
  'NV': [38.8026, -116.4194],
  'NH': [43.4525, -71.5639],
  'NJ': [40.0583, -74.4057],
  'NM': [34.5199, -105.8701],
  'NY': [42.1657, -74.9481],
  'NC': [35.6301, -79.8064],
  'ND': [47.5289, -99.7840],
  'OH': [40.3888, -82.7649],
  'OK': [35.5653, -96.9289],
  'OR': [44.5720, -122.0709],
  'PA': [40.5908, -77.2098],
  'RI': [41.6809, -71.5118],
  'SC': [33.8569, -80.9450],
  'SD': [44.2998, -99.4388],
  'TN': [35.7478, -86.6923],
  'TX': [31.0545, -97.5635],
  'UT': [39.3210, -111.0937],
  'VT': [44.0459, -72.7107],
  'VA': [37.7693, -78.1700],
  'WA': [47.4009, -121.4905],
  'WV': [38.5976, -80.4549],
  'WI': [44.2685, -89.6165],
  'WY': [42.7559, -107.3024]
};

function StateMapContainer({ stateName, onBackToNational }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [filters, setFilters] = useState({
    selectedYears: [2018],
    selectedMonths: [],
    selectedDays: [],
    visualizationType: 'accidents' // 'accidents' or 'severity'
  });

  // Create color scale
  const colorScale = useMemo(() => 
    scaleQuantize()
      .domain([0, 100])
      .range([
        '#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C',
        '#FC4E2A', '#E31A1C', '#BD0026', '#800026'
      ]), 
    []
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('state', stateName);
        
        if (filters.selectedYears.length > 0) {
          filters.selectedYears.forEach(year => params.append('years[]', year));
        }
        if (filters.selectedMonths.length > 0) {
          filters.selectedMonths.forEach(month => params.append('months[]', month));
        }
        if (filters.selectedDays.length > 0) {
          filters.selectedDays.forEach(day => params.append('days[]', day));
        }

        const response = await axios.get(`/api/state/details?${params}`);
        setData(response.data);

      } catch (error) {
        console.error('Error fetching state data:', error);
        setError(error.response?.data?.message || 'Failed to load state data');
      } finally {
        setLoading(false);
      }
    };

    if (stateName) {
      fetchData();
    }
  }, [stateName, filters]);

  // Style handler for counties
  const getCountyStyle = (feature) => {
    const value = filters.visualizationType === 'accidents' 
      ? feature.properties.percentage_of_total
      : feature.properties.avg_severity * 25; // Scale severity to 0-100 range

    return {
      fillColor: colorScale(value),
      weight: feature.properties.name === selectedCounty ? 2 : 1,
      opacity: 1,
      color: '#666',
      fillOpacity: feature.properties.name === selectedCounty ? 0.9 : 0.7
    };
  };

  // County interaction handlers
  const onEachCounty = (feature, layer) => {
    const props = feature.properties;
    
    const tooltipContent = `
      <div class="county-tooltip">
        <strong>${props.name} County</strong><br/>
        Accidents: ${props.accident_count.toLocaleString()}<br/>
        Severity: ${props.avg_severity.toFixed(2)}<br/>
        ${props.common_weather ? `Weather: ${props.common_weather}` : ''}
      </div>
    `;

    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'auto'
    });

    layer.on({
      click: () => setSelectedCounty(props.name),
      mouseover: () => layer.setStyle({ fillOpacity: 0.9, weight: 2 }),
      mouseout: () => {
        if (props.name !== selectedCounty) {
          layer.setStyle({ fillOpacity: 0.7, weight: 1 });
        }
      }
    });
  };

  // Render statistics panel
  const renderStatistics = () => {
    if (!data?.summary) return null;

    const formatNumber = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return typeof value === 'number' ? value.toLocaleString() : value;
    };

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 90,
          right: 20,
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 2,
          borderRadius: 1,
          zIndex: 1000,
          width: 300,
          backdropFilter: 'blur(8px)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          {stateName} Statistics
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Total Accidents:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatNumber(data.summary.total_accidents)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Average Severity:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {Number(data.summary.avg_severity).toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Counties Affected:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatNumber(data.summary.counties_affected)}
            </Typography>
          </Box>

          {data.summary.common_weather && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Common Weather:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {data.summary.common_weather}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Render selected county details
  const renderCountyDetails = () => {
    if (!selectedCounty || !data?.geojson) return null;

    const countyData = data.geojson.features.find(
      f => f.properties.name === selectedCounty
    );

    if (!countyData) return null;

    const props = countyData.properties;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 20,
          transform: 'translateY(-50%)',
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          p: 2,
          borderRadius: 1,
          zIndex: 1000,
          maxWidth: '300px'
        }}
      >
        <Typography variant="h6" gutterBottom>
          {selectedCounty} County
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Total Accidents: {props.accident_count.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            Average Severity: {props.avg_severity.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            Percentage of State: {props.percentage_of_total.toFixed(1)}%
          </Typography>
          
          {props.cities && props.cities.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                Cities: {props.cities.slice(0, 3).join(', ')}
                {props.cities.length > 3 && '...'}
              </Typography>
            </Box>
          )}

          {props.common_weather && (
            <Typography variant="body2">
              Common Weather: {props.common_weather}
            </Typography>
          )}
        </Box>

        <Button
          size="small"
          sx={{ mt: 2, color: 'white' }}
          onClick={() => setSelectedCounty(null)}
        >
          Clear Selection
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', position: 'relative', bgcolor: '#061428' }}>
      <MapContainer
        center={STATE_CENTERS[stateName] || [39.8283, -98.5795]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topleft" />
        {data?.geojson && (
          <GeoJSON
            key={`${stateName}-${filters.visualizationType}-${JSON.stringify(filters.selectedYears)}`}
            data={data.geojson}
            style={getCountyStyle}
            onEachFeature={onEachCounty}
          />
        )}
      </MapContainer>

      {/* Back Button */}
      <Box sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000
      }}>
        <Button
          variant="contained"
          onClick={onBackToNational}
          sx={{
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.9)'
            }
          }}
        >
          Back to United States
        </Button>
      </Box>

      {/* Time Filter */}
<TimeFilter 
  filters={filters}
  onChange={setFilters}
  sx={{
    top: 80, // Adjust this value to position below the back button
    left: 20,
    zIndex: 1001 // Ensure it's above other controls
  }}
/>

      {/* Visualization Type Toggle */}
      <Box sx={{
        position: 'absolute',
        top: 400,
        left: 20,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        p: 2,
        borderRadius: 1,
        zIndex: 1000
      }}>
        <FormControl>
          <FormLabel sx={{ color: 'white' }}>View Data</FormLabel>
          <RadioGroup
            value={filters.visualizationType}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              visualizationType: e.target.value
            }))}
          >
            <FormControlLabel 
              value="accidents" 
              control={<Radio sx={{ color: 'white' }} />} 
              label="Accident Count" 
            />
            <FormControlLabel 
              value="severity" 
              control={<Radio sx={{ color: 'white' }} />} 
              label="Average Severity" 
            />
          
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Legend */}
      <Box sx={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        p: 2,
        borderRadius: 1,
        zIndex: 1000
      }}>
        <Typography variant="subtitle2" gutterBottom>
          {filters.visualizationType === 'accidents' ? 'Accident Density' : 'Severity Scale'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          {colorScale.range().map((color, i) => (
            <Box
              key={i}
              sx={{
                width: 30,
                height: 20,
                bgcolor: color
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption">Low</Typography>
          <Typography variant="caption">High</Typography>
        </Box>
        <Typography variant="caption" sx={{ 
          display: 'block', 
          mt: 1, 
          color: 'rgba(255,255,255,0.7)'
        }}>
          {filters.visualizationType === 'accidents' 
            ? 'Percentage of state total'
            : 'Average accident severity'}
        </Typography>
      </Box>

      {/* Statistics Panel */}
      {renderStatistics()}

      {/* Selected County Details */}
      {renderCountyDetails()}

      {/* Loading Indicator */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 2,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1000
          }}
        >
          <CircularProgress size={24} sx={{ color: 'white' }} />
          <Typography>Loading {stateName} data...</Typography>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            minWidth: '300px',
            bgcolor: 'rgba(211, 47, 47, 0.9)',
            color: 'white',
            '& .MuiAlert-icon': {
              color: 'white'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Weather Conditions Summary */}
      {data?.summary?.weather_conditions && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 2,
            borderRadius: 1,
            zIndex: 1000,
            maxWidth: '300px'
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Weather Conditions
          </Typography>
          <Box sx={{ 
            maxHeight: '100px', 
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255,255,255,0.1)'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '4px'
            }
          }}>
            {data.summary.weather_conditions.slice(0, 5).map((weather, index) => (
              <Typography key={index} variant="caption" sx={{ display: 'block' }}>
                • {weather}
              </Typography>
            ))}
            {data.summary.weather_conditions.length > 5 && (
              <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)' }}>
                And {data.summary.weather_conditions.length - 5} more...
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Map Attribution */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 5,
          right: 5,
          color: 'rgba(255,255,255,0.5)',
          fontSize: '10px',
          zIndex: 1000
        }}
      >
        Map data © OpenStreetMap contributors
      </Box>
    </Box>
  );
}

export default StateMapContainer;
