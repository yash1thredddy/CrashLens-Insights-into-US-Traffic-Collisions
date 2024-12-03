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

  // Fetch data based on filters
const resizeConstraints = useMemo(() => ({
  minConstraints: [800, isMinimized ? 60 : 500],
  maxConstraints: [window.innerWidth - 40, isMinimized ? 60 : window.innerHeight - 40]
}), [isMinimized]);

useEffect(() => {
  const fetchData = async () => {
    if (!county || !state) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('county', county);
      params.append('state', state);
      params.append('timeType', timeType);
      
      if (filters.selectedYears?.length > 0) {
        filters.selectedYears.forEach(year => params.append('years[]', year));
      }
      if (filters.selectedMonths?.length > 0) {
        filters.selectedMonths.forEach(month => params.append('months[]', month));
      }
      if (filters.selectedDays?.length > 0) {
        filters.selectedDays.forEach(day => params.append('days[]', day));
      }

      const response = await axios.get(`/api/county/time-analysis?${params}`);
      
      // Keep full dataset for brushing
      const formattedData = response.data.data.timeValues.map((value, index) => ({
        name: timeType === 'day' ? dayNames[value] :
             timeType === 'month' ? monthNames[value] :
             value.toString().padStart(2, '0') + ':00',
        accidents: response.data.data.accidentCounts[index],
        timeValue: value
      }));

      setData(formattedData);
    } catch (err) {
      console.error('Error fetching time analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [county, state, timeType, filters]); // Remove brushRange from dependencies

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

const handleApplySelection = () => {
  if (!brushRange) return;

  const newFilters = { ...filters };

  // Clear previous time-specific filters
  newFilters.selectedHours = [];
  newFilters.selectedDays = [];
  newFilters.selectedMonths = [];

  const startValue = Math.min(brushRange.start, brushRange.end);
  const endValue = Math.max(brushRange.start, brushRange.end);
  const length = endValue - startValue + 1;

  switch (timeType) {
    case 'hour':
      newFilters.selectedHours = Array.from({ length }, (_, i) => startValue + i);
      break;
    case 'day':
      // For day of week, we're selecting days 0-6 (Sun-Sat)
      // Don't update the calendar days in TimeFilter
      // Instead, we can add a new field for days of week
      newFilters.selectedDayOfWeek = Array.from({ length }, (_, i) => startValue + i);
      // Clear the regular days to avoid confusion
      newFilters.selectedDays = [];
      break;
    case 'month':
      newFilters.selectedMonths = Array.from({ length }, (_, i) => startValue + i);
      break;
    default:
      break;
  }

  onFilterChange(newFilters);
  setShowCityAnalysis(true);
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
                  onFilterChange({
                    ...filters,
                    selectedHours: [],
                    selectedDays: [],
                    selectedMonths: []
                  });
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
                      startIndex={brushRange?.startIndex}  // Add this
                      endIndex={brushRange?.endIndex}      // Add this
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
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
                    filters={filters}
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