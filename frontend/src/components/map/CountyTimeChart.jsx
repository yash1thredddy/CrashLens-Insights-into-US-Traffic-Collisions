import React, { useState, useEffect, useRef } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, IconButton } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { X, Minimize, Maximize } from 'lucide-react';
import 'react-resizable/css/styles.css';
import axios from 'axios';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CountyTimeChart = ({ county, state, filters, onClose }) => {
  const nodeRef = useRef(null);
  const [timeType, setTimeType] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 1000, height: 700 });

  // Set initial centered position on mount
  useEffect(() => {
    if (nodeRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const chartWidth = size.width;
      const chartHeight = size.height;
      
      setPosition({
        x: (windowWidth - chartWidth) / 2,
        y: (windowHeight - chartHeight) / 2
      });
    }
  }, []);

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
        console.log('API Response:', response.data);
        
        const formattedData = response.data.data.timeValues.map((value, index) => ({
          name: timeType === 'day' ? dayNames[value] :
               timeType === 'month' ? monthNames[value] :
               value.toString().padStart(2, '0') + ':00',
          accidents: response.data.data.accidentCounts[index]
        }));

        console.log('Formatted Data:', formattedData);
        setData(formattedData);
      } catch (err) {
        console.error('Error fetching time analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [county, state, timeType, filters]);

  const onResize = (event, { size }) => {
    setSize({ width: size.width, height: size.height });
  };

  const onDragStop = (e, data) => {
    setPosition({ x: data.x, y: data.y });
  };

  return (
    <Draggable 
      handle=".drag-handle" 
      nodeRef={nodeRef}
      defaultClassName="draggable-chart"
    >
      <div 
        ref={nodeRef} 
        style={{ 
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        }}
      >
        <Box
          sx={{
            width: size.width,
            height: size.height,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderRadius: 2,
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            resize: 'both'
          }}
        >
          {/* Header */}
          <Box
            className="drag-handle"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'move',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              flexShrink: 0
            }}
          >
            <Typography variant="h6" sx={{ fontSize: '1rem' }}>
              {county} County Time Analysis
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
          <Box sx={{ p: 3, flexGrow: 1, overflow: 'hidden' }}>
            {/* Controls */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'white' }}>Time Period</InputLabel>
                <Select
                  value={timeType}
                  onChange={(e) => setTimeType(e.target.value)}
                  label="Time Period"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    }
                  }}
                >
                  <MenuItem value="hour">Hour of Day</MenuItem>
                  <MenuItem value="day">Day of Week</MenuItem>
                  <MenuItem value="month">Month of Year</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Chart */}
            {!isMinimized && (
              <Box sx={{ height: 'calc(100% - 80px)', width: '100%' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography>Loading...</Typography>
                  </Box>
                ) : error ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="error">{error}</Typography>
                  </Box>
                ) : data && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="name"
                        stroke="white"
                        tick={{ fill: 'white', fontSize: 12 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        stroke="white"
                        tick={{ fill: 'white', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '4px',
                          color: 'white'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accidents"
                        stroke="#2196f3"
                        strokeWidth={2}
                        dot={{ fill: '#2196f3', r: 4 }}
                        activeDot={{ r: 6, fill: '#64b5f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </div>
    </Draggable>
  );
};

export default CountyTimeChart;