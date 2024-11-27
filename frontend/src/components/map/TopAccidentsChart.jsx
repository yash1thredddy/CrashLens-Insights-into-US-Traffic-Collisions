import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Box, 
  FormControl, 
  Select, 
  MenuItem, 
  Typography,
  CircularProgress,
  FormLabel,
  Button
} from '@mui/material';
import { Map } from 'lucide-react';
import axios from 'axios';

const TopAccidentsChart = ({ filters, selectedState, onStateSelect }) => {
  const [viewType, setViewType] = useState('state');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [statesList, setStatesList] = useState([]);
  const svgRef = useRef(null);

  // Fetch states list on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get('/api/spatial/states');
        setStatesList(response.data);
      } catch (err) {
        console.error('Error fetching states:', err);
      }
    };
    fetchStates();
  }, []);

  // Reset selections when view type changes
  useEffect(() => {
    if (viewType === 'state') {
      onStateSelect(null);
      setSelectedCounty(null);
    }
  }, [viewType]);

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();

        // Add time filters
        if (filters.selectedYears?.length) {
          filters.selectedYears.forEach(year => params.append('years[]', year));
        }
        if (filters.selectedMonths?.length) {
          filters.selectedMonths.forEach(month => params.append('months[]', month));
        }
        if (filters.selectedDays?.length) {
          filters.selectedDays.forEach(day => params.append('days[]', day));
        }

        // Add hierarchy filters
        params.append('view_type', viewType);
        if (selectedState) params.append('state', selectedState);
        if (selectedCounty) params.append('county', selectedCounty);

        const response = await axios.get(`/api/spatial/top-accidents?${params}`);
        setData(response.data.slice(0, 10));
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [viewType, selectedState, selectedCounty, filters.selectedYears, filters.selectedMonths, filters.selectedDays]);

  // D3 visualization effect
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 20, bottom: 60, left: 80 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.2)
      .domain(data.map(d => d.name));

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, d => d.accidents)]);

    // Add gradient definition
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8E24AA");
    gradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#3F51B5");
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#2196F3");

    // Add axes
    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .style('fill', 'white');

    xAxis.selectAll('path, line')
      .style('stroke', 'rgba(255,255,255,0.3)');

    const yAxis = svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",d")));

    yAxis.selectAll('text')
      .style('fill', 'white');

    yAxis.selectAll('path, line')
      .style('stroke', 'rgba(255,255,255,0.3)');

    // Add bars with animation
    const bars = svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.name))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .style('fill', 'url(#bar-gradient)')
      .style('opacity', 0.8);

    // Animate bars
    bars.transition()
      .duration(1000)
      .attr('y', d => y(d.accidents))
      .attr('height', d => height - y(d.accidents));

    // Add hover effects

bars.on('mouseover', function(event, d) {
  d3.select(this)
    .style('opacity', 1)
    .style('filter', 'brightness(1.2)');

  const tooltip = svg.append('g')
    .attr('class', 'tooltip')
    .attr('transform', `translate(${x(d.name) + x.bandwidth()/2}, ${y(d.accidents) - 10})`);

  // Add accidents count
  tooltip.append('text')
    .attr('text-anchor', 'middle')
    .style('fill', 'white')
    .style('font-size', '12px')
    .text(`${d3.format(",")(d.accidents)} accidents`);

  // Only add severity if it exists and is a number
  if (d.avg_severity != null && !isNaN(d.avg_severity)) {
    tooltip.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -20)
      .style('fill', 'white')
      .style('font-size', '12px')
      .text(`Avg Severity: ${Number(d.avg_severity).toFixed(2)}`);
  }
})
.on('mouseout', function() {
  d3.select(this)
    .style('opacity', 0.8)
    .style('filter', 'brightness(1)');
  svg.selectAll('.tooltip').remove();
})
.on('click', function(event, d) {
  if (viewType === 'state') {
    onStateSelect(d.name);
    setViewType('county');
  } else if (viewType === 'county') {
    setSelectedCounty(d.name);
    setViewType('city');
  }
});

  }, [data, viewType]);

  return (
    <Box 
      sx={{
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 1,
        p: 2,
        color: 'white',
        backdropFilter: 'blur(8px)',
        width: 450
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Top 10 Areas by Accident Count
        </Typography>
        {selectedState && viewType === 'county' && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Map size={16} />}
            onClick={() => window.location.href = `#/state/${selectedState}`}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            View on Map
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <FormLabel sx={{ color: 'white', mb: 1 }}>View Level</FormLabel>
          <Select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            sx={{
              color: 'white',
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            <MenuItem value="state">States</MenuItem>
            <MenuItem value="county">Counties</MenuItem>
            <MenuItem value="city">Cities</MenuItem>
          </Select>
        </FormControl>

        {(viewType === 'county' || viewType === 'city') && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <FormLabel sx={{ color: 'white', mb: 1 }}>State</FormLabel>
            <Select
              value={selectedState || ''}
              onChange={(e) => onStateSelect(e.target.value)}
              sx={{
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <MenuItem value="">All States</MenuItem>
              {statesList.map(state => (
                <MenuItem key={state} value={state}>{state}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {viewType === 'city' && selectedState && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <FormLabel sx={{ color: 'white', mb: 1 }}>County</FormLabel>
            <Select
              value={selectedCounty || ''}
              onChange={(e) => setSelectedCounty(e.target.value)}
              sx={{
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              <MenuItem value="">All Counties</MenuItem>
              {data.map(item => (
                <MenuItem key={item.name} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box>
          <svg ref={svgRef} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'center', mt: 1 }}>
            Click on bars to drill down
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TopAccidentsChart;