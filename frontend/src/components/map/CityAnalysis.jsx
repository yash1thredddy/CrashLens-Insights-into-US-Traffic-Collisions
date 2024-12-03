import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton, 
  Collapse,
  CircularProgress,
  Alert
} from '@mui/material';
import { ChevronRight, ChevronDown } from 'lucide-react';
import axios from 'axios';

const CityAnalysis = ({ county, state, timeRange, filters }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCity, setExpandedCity] = useState(null);
  const [streets, setStreets] = useState({});
  const [loadingStreets, setLoadingStreets] = useState(false);

  useEffect(() => {
    const fetchCityData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('county', county);
        params.append('state', state);
        params.append('timeType', timeRange.type);
        params.append('startTime', timeRange.start);
        params.append('endTime', timeRange.end);
        
        if (filters.selectedYears?.length) {
          filters.selectedYears.forEach(year => params.append('years[]', year));
        }
        if (filters.selectedMonths?.length) {
          filters.selectedMonths.forEach(month => params.append('months[]', month));
        }
        if (filters.selectedDays?.length) {
          filters.selectedDays.forEach(day => params.append('days[]', day));
        }

        console.log('Fetching city data with params:', Object.fromEntries(params));
        
        const response = await axios.get(`/api/analysis/cities?${params}`);
        console.log('City data response:', response.data);
        
        setCities(response.data);
      } catch (err) {
        console.error('Error fetching city data:', err);
        setError(err.response?.data?.message || 'Failed to load city data');
      } finally {
        setLoading(false);
      }
    };

    if (timeRange) {
      fetchCityData();
    }
  }, [county, state, timeRange, filters]);

  const handleCityClick = async (city) => {
    if (expandedCity === city) {
      setExpandedCity(null);
      return;
    }

    setExpandedCity(city);
    setLoadingStreets(true);

    try {
      const params = new URLSearchParams();
      params.append('city', city);
      params.append('county', county);
      params.append('state', state);
      params.append('timeType', timeRange.type);
      params.append('startTime', timeRange.start);
      params.append('endTime', timeRange.end);

      if (filters.selectedYears?.length) {
        filters.selectedYears.forEach(year => params.append('years[]', year));
      }
      if (filters.selectedMonths?.length) {
        filters.selectedMonths.forEach(month => params.append('months[]', month));
      }
      if (filters.selectedDays?.length) {
        filters.selectedDays.forEach(day => params.append('days[]', day));
      }

      console.log('Fetching street data with params:', Object.fromEntries(params));
      
      const response = await axios.get(`/api/analysis/streets?${params}`);
      console.log('Street data response:', response.data);
      
      setStreets({ ...streets, [city]: response.data });
    } catch (err) {
      console.error('Error fetching street data:', err);
      setError('Failed to load street data');
    } finally {
      setLoadingStreets(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          m: 2,
          bgcolor: 'rgba(211, 47, 47, 0.2)',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white'
          }
        }}
      >
        {error}
      </Alert>
    );
  }

  if (!cities.length) {
    return (
      <Typography variant="body2" sx={{ p: 2, color: 'rgba(255,255,255,0.7)' }}>
        No accident data available for selected time range
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Top Cities
      </Typography>
      
      <List sx={{ width: '100%', bgcolor: 'transparent' }}>
        {cities.map((city) => (
          <React.Fragment key={city.name}>
            <ListItemButton 
              onClick={() => handleCityClick(city.name)}
              sx={{
                borderLeft: '2px solid',
                borderLeftColor: expandedCity === city.name ? '#2196f3' : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderLeftColor: '#2196f3',
                  bgcolor: 'rgba(33, 150, 243, 0.1)'
                }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} component="div">
                    {expandedCity === city.name ? 
                      <ChevronDown size={16} /> : 
                      <ChevronRight size={16} />
                    }
                    <Typography component="span">
                      {city.name}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    color: 'rgba(255,255,255,0.7)'
                  }} component="div">
                    <Typography variant="body2" component="span">
                      {city.accidents.toLocaleString()} accidents
                    </Typography>
                    <Typography variant="body2" component="span">
                      Severity: {city.avgSeverity.toFixed(2)}
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>

            <Collapse in={expandedCity === city.name} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                {loadingStreets ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  </Box>
                ) : streets[city.name]?.length > 0 ? (
                  <List disablePadding>
                    {streets[city.name].map((street, idx) => (
                      <ListItem 
                        key={idx}
                        sx={{ 
                          py: 1,
                          borderBottom: '1px solid rgba(255,255,255,0.1)',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography component="div">
                              {street.name || 'Unnamed Street'}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              color: 'rgba(255,255,255,0.7)'
                            }} component="div">
                              <Typography variant="body2" component="span">
                                {street.accidents.toLocaleString()} accidents
                              </Typography>
                              <Typography variant="body2" component="span">
                                Severity: {street.avgSeverity.toFixed(2)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', py: 2 }}>
                    No street data available
                  </Typography>
                )}
              </Box>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default CityAnalysis;