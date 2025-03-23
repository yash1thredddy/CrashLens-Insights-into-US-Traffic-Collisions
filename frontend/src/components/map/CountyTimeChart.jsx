import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, IconButton, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { X, Minimize, Maximize, RotateCcw } from 'lucide-react';
import axios from 'axios';
import 'react-resizable/css/styles.css';
import CityAnalysis from './CityAnalysis';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = [
  null,
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FeatureButton = ({ feature, count, percentage, active, onClick }) => (
  <Button
    variant={active ? "contained" : "outlined"}
    onClick={() => onClick(feature)}
    sx={{
      color: 'white',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: active ? 'rgba(33, 150, 243, 0.8)' : 'transparent',
      '&:hover': {
        backgroundColor: active ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.1)',
        borderColor: 'white'
      },
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px'
    }}
  >
    <Typography variant="h6" component="div">
      {count.toLocaleString()}
    </Typography>
    <Typography variant="caption" sx={{ mb: 0.5 }}>
      {feature === 'dayTime' ? 'Day' :
       feature === 'nightTime' ? 'Night' :
       feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
    </Typography>
    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
      {percentage}% of total
    </Typography>
  </Button>
);

const TrafficFeatureStats = ({ trafficFeatures, activeFeature, onFeatureSelect }) => {
  if (!trafficFeatures) return null;

  const features = [
    { key: 'crossing', label: 'Crossing' },
    { key: 'junction', label: 'Junction' },
    { key: 'station', label: 'Station' },
    { key: 'stop', label: 'Stop' },
    { key: 'trafficSignal', label: 'Traffic Signal' },
    { key: 'dayTime', label: 'Day' },
    { key: 'nightTime', label: 'Night' }
  ];

  return (
    <Box sx={{ 
      borderTop: '1px solid rgba(255,255,255,0.1)', 
      mt: 3,
      pt: 2
    }}>
      <Typography variant="subtitle1" gutterBottom>
        Traffic Features
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 2 
      }}>
        {features.map(({ key }) => (
          <FeatureButton
            key={key}
            feature={key}
            count={trafficFeatures[key]?.count || 0}
            percentage={trafficFeatures[key]?.percentage || 0}
            active={activeFeature === key}
            onClick={onFeatureSelect}
          />
        ))}
      </Box>
    </Box>
  );
};



const CountyTimeChart = ({ county, state, filters, onClose, onFilterChange }) => {
  const nodeRef = useRef(null);
  const [timeType, setTimeType] = useState('hour');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [brushRange, setBrushRange] = useState(null);
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [showCityAnalysis, setShowCityAnalysis] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [trafficFeatures, setTrafficFeatures] = useState(null);

  // Fetch data based on filters
const resizeConstraints = useMemo(() => ({
  minConstraints: [800, isMinimized ? 60 : 500],
  maxConstraints: [window.innerWidth - 40, isMinimized ? 60 : window.innerHeight - 40]
}), [isMinimized]);

// Modify fetchData to accept brush range
const fetchData = async (currentFilters = filters, brushSelection = null) => {
  if (!county || !state) return;

  setLoading(true);
  setError(null);

  try {
    const params = new URLSearchParams();
    params.append('county', county);
    params.append('state', state);
    params.append('timeType', timeType);
    
    // Add feature filter
    if (activeFeature) {
      if (activeFeature === 'dayTime') {
        params.append('feature', 'Day');
      } else if (activeFeature === 'nightTime') {
        params.append('feature', 'Night');
      } else {
        params.append('feature', activeFeature);
      }
    }
    
    // Add brush selection time filters
    if (brushSelection) {
      const startValue = Math.min(brushSelection.start, brushSelection.end);
      const endValue = Math.max(brushSelection.start, brushSelection.end);
      
      switch (timeType) {
        case 'hour':
          for (let i = startValue; i <= endValue; i++) {
            params.append('hours[]', i);
          }
          break;
        case 'day':
          for (let i = startValue; i <= endValue; i++) {
            params.append('days[]', i);
          }
          break;
        case 'month':
          for (let i = startValue; i <= endValue; i++) {
            params.append('months[]', i);
          }
          break;
        default:
          break;
      }
    } else {
      // Add regular time filters if no brush selection
      if (currentFilters.selectedHours?.length > 0) {
        currentFilters.selectedHours.forEach(hour => params.append('hours[]', hour));
      }
      if (currentFilters.selectedDays?.length > 0) {
        currentFilters.selectedDays.forEach(day => params.append('days[]', day));
      }
      if (currentFilters.selectedMonths?.length > 0) {
        currentFilters.selectedMonths.forEach(month => params.append('months[]', month));
      }
    }
    
    // Always add year filter
    if (currentFilters.selectedYears?.length > 0) {
      currentFilters.selectedYears.forEach(year => params.append('years[]', year));
    }

    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/county/time-analysis?${params}`);
    
    const formattedData = response.data.data.timeValues.map((value, index) => ({
      name: timeType === 'day' ? dayNames[value] :
           timeType === 'month' ? monthNames[value] :
           value.toString().padStart(2, '0') + ':00',
      accidents: response.data.data.accidentCounts[index],
      timeValue: value
    }));

    setData(formattedData);
    setTrafficFeatures(response.data.trafficFeatures);
  } catch (err) {
    console.error('Error fetching time analysis:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [county, state, timeType, filters, activeFeature]);// Remove brushRange from dependencies

    const handleFeatureSelect = (feature) => {
    setActiveFeature(activeFeature === feature ? null : feature);
    //setBrushRange(null);
    //setShowCityAnalysis(false);
  };
  
const handleBrushChange = (brushData) => {
  // Only update if there's a valid brush selection
  if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
    const selectedData = data.slice(brushData.startIndex, brushData.endIndex + 1);
    setBrushRange({
      type: timeType,
      start: selectedData[0].timeValue,
      end: selectedData[selectedData.length - 1].timeValue,
      data: selectedData,
      // Store brush indexes to maintain selection
      startIndex: brushData.startIndex,
      endIndex: brushData.endIndex
    });
  } else {
    setBrushRange(null);
  }
};

// Update handleApplySelection to properly handle both feature and brush filters
const handleApplySelection = () => {
  if (!brushRange) return;

  const newFilters = { ...filters };
  const startValue = Math.min(brushRange.start, brushRange.end);
  const endValue = Math.max(brushRange.start, brushRange.end);

  // Set time range filters
  switch (timeType) {
    case 'hour':
      newFilters.selectedHours = Array.from(
        { length: endValue - startValue + 1 }, 
        (_, i) => startValue + i
      );
      break;
    case 'day':
      newFilters.selectedDayOfWeek = Array.from(
        { length: endValue - startValue + 1 }, 
        (_, i) => startValue + i
      );
      break;
    case 'month':
      newFilters.selectedMonths = Array.from(
        { length: endValue - startValue + 1 }, 
        (_, i) => startValue + i
      );
      break;
    default:
      break;
  }

  // Keep the active feature filter
  if (activeFeature) {
    newFilters.feature = activeFeature;
  }

  onFilterChange(newFilters);
  setShowCityAnalysis(true);
  
  // Fetch data with both time range and feature filters
  fetchData(newFilters, {
    start: startValue,
    end: endValue,
    type: timeType
  });
};



return (
  <Draggable handle=".drag-handle" nodeRef={nodeRef}>
    <div ref={nodeRef}>
        <ResizableBox
          width={size.width}
          height={isMinimized ? 60 : size.height}
          onResize={(e, { size }) => setSize(size)}
          minConstraints={resizeConstraints.minConstraints}
          maxConstraints={resizeConstraints.maxConstraints}
        >
        <Box sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderRadius: 2,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <Box className="drag-handle" sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            cursor: 'move'
          }}>
            <Typography variant="h6">
              {county} County Time Analysis
              {brushRange && (
                <Typography component="span" variant="caption" sx={{ ml: 2, color: 'rgba(255,255,255,0.7)' }}>
                  Selected: {brushRange.start} - {brushRange.end}
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
  size="small"
  onClick={() => {
    setBrushRange(null);
    setShowCityAnalysis(false);
    setActiveFeature(null);  // Reset active feature
    const newFilters = {
      ...filters,
      feature: null,
      selectedHours: [],
      selectedDays: [],
      selectedMonths: []
    };
    onFilterChange(newFilters);
    fetchData(newFilters);  // Fetch fresh data with reset filters
  }}
  sx={{ color: 'white' }}
  title="Reset Selection"
>
  <RotateCcw size={18} />
</IconButton>
              <IconButton 
                size="small"
                onClick={() => setIsMinimized(!isMinimized)}
                sx={{ color: 'white' }}
              >
                {isMinimized ? <Maximize size={18} /> : <Minimize size={18} />}
              </IconButton>
              <IconButton 
                size="small"
                onClick={onClose}
                sx={{ color: 'white' }}
              >
                <X size={18} />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          
          <Box sx={{ p: 3, flexGrow: 1, display: 'flex', gap: 3, overflow: 'hidden' }}>
            {/* Chart Section */}
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small">
                  <InputLabel sx={{ color: 'white' }}>Time Period</InputLabel>
                  <Select
                    value={timeType}
                    onChange={(e) => {
                      setTimeType(e.target.value);
                      setBrushRange(null);
                      setShowCityAnalysis(false);
                    }}
                    label="Time Period"
                    sx={{ color: 'white', minWidth: 150 }}
                  >
                    <MenuItem value="hour">Hour of Day</MenuItem>
                    <MenuItem value="day">Day of Week</MenuItem>
                    <MenuItem value="month">Month of Year</MenuItem>
                  </Select>
                </FormControl>

                {brushRange && (
                  <Button
                    variant="contained"
                    onClick={handleApplySelection}
                    sx={{
                      bgcolor: '#2196f3',
                      '&:hover': { bgcolor: '#1976d2' }
                    }}
                  >
                    Apply Selection
                  </Button>
                )}
              </Box>

 {!isMinimized && data && (
  <>
    <Box sx={{ flexGrow: 1, minHeight: 0 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="name"
            stroke="white"
            tick={{ fill: 'white', fontSize: 12 }}
            domain={brushRange ? ['dataMin', 'dataMax'] : undefined}
          />
          <YAxis stroke="white" tick={{ fill: 'white', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <Line
            type="monotone"
            dataKey="accidents"
            stroke="#2196f3"
            strokeWidth={2}
            dot={{ fill: '#2196f3', r: 4 }}
          />
          <Brush
            dataKey="name"
            height={30}
            stroke="#2196f3"
            onChange={handleBrushChange}
            fill="rgba(33, 150, 243, 0.1)"
            startIndex={brushRange?.startIndex}
            endIndex={brushRange?.endIndex}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
    {/* Use trafficFeatures state instead of data.trafficFeatures */}
    {trafficFeatures && (  
      <TrafficFeatureStats 
        trafficFeatures={trafficFeatures}  // Changed from data.trafficFeatures
        activeFeature={activeFeature}
        onFeatureSelect={handleFeatureSelect}
      />
    )}
  </>
)}
            </Box>

            {/* City Analysis Section */}
            {showCityAnalysis && brushRange && (
              <Box sx={{ 
                flex: 1, 
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)', 
                pl: 3,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0
              }}>
                <Box sx={{ 
                  overflow: 'auto',
                  flexGrow: 1,
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
                  <CityAnalysis
                    county={county}
                    state={state}
                    timeRange={brushRange}
                    filters={{
                      ...filters,
                      // Feature filters
                      feature: activeFeature,
                      type: activeFeature === 'dayTime' ? 'Day' : 
                            activeFeature === 'nightTime' ? 'Night' : 
                            activeFeature,
                      crossing: activeFeature === 'crossing',
                      junction: activeFeature === 'junction',
                      station: activeFeature === 'station',
                      stop: activeFeature === 'stop',
                      trafficSignal: activeFeature === 'trafficSignal',
                      timeOfDay: activeFeature === 'dayTime' ? 'Day' : 
                                activeFeature === 'nightTime' ? 'Night' : 
                                null,
                      // Time filters based on brush selection
                      selectedHours: brushRange.type === 'hour' ? 
                        Array.from({ length: brushRange.end - brushRange.start + 1 }, 
                          (_, i) => brushRange.start + i) : 
                        filters.selectedHours,
                      selectedDays: brushRange.type === 'day' ? 
                        Array.from({ length: brushRange.end - brushRange.start + 1 }, 
                          (_, i) => brushRange.start + i) : 
                        filters.selectedDays,
                      selectedMonths: brushRange.type === 'month' ? 
                        Array.from({ length: brushRange.end - brushRange.start + 1 }, 
                          (_, i) => brushRange.start + i) : 
                        filters.selectedMonths,
                      // Regular filters
                      selectedDayOfWeek: filters.selectedDayOfWeek || [],
                      yearRange: filters.selectedYears || [],
                      // Brush information
                      brushStartIndex: brushRange.startIndex,
                      brushEndIndex: brushRange.endIndex,
                      // Range information
                      startValue: brushRange.start,
                      endValue: brushRange.end,
                      timeType: brushRange.type
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </ResizableBox>
    </div>
  </Draggable>
);
};

export default CountyTimeChart;