import React from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';

const TimeFilter = ({ filters, onChange }) => {
  // Year range from 2016 to 2023
  const years = Array.from({ length: 8 }, (_, i) => 2016 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  const getMonthName = (month) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 3,
        borderRadius: 2,
        color: 'white',
        width: 300,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>

      {/* Multiple Year Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: 'white' }}>Years</InputLabel>
        <Select
          multiple
          value={filters.selectedYears || []}
          onChange={(e) => handleChange('selectedYears', e.target.value)}
          input={<OutlinedInput label="Years" />}
          renderValue={(selected) => selected.length === 0 ? 'All Years' : selected.join(', ')}
          sx={{ 
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
          }}
        >
          <MenuItem value="all">
            <Checkbox 
              checked={filters.selectedYears?.length === 0}
              indeterminate={filters.selectedYears?.length > 0 && filters.selectedYears?.length < years.length}
            />
            <ListItemText primary="All Years" />
          </MenuItem>
          {years.map(year => (
            <MenuItem key={year} value={year}>
              <Checkbox checked={filters.selectedYears?.includes(year) || false} />
              <ListItemText primary={year} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Multiple Month Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: 'white' }}>Months</InputLabel>
        <Select
          multiple
          value={filters.selectedMonths || []}
          onChange={(e) => handleChange('selectedMonths', e.target.value)}
          input={<OutlinedInput label="Months" />}
          renderValue={(selected) => selected.length === 0 ? 'All Months' : 
            selected.map(month => getMonthName(month)).join(', ')}
          sx={{ 
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
          }}
        >
          <MenuItem value="all">
            <Checkbox 
              checked={filters.selectedMonths?.length === 0}
              indeterminate={filters.selectedMonths?.length > 0 && filters.selectedMonths?.length < months.length}
            />
            <ListItemText primary="All Months" />
          </MenuItem>
          {months.map(month => (
            <MenuItem key={month} value={month}>
              <Checkbox checked={filters.selectedMonths?.includes(month) || false} />
              <ListItemText primary={getMonthName(month)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Multiple Day Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: 'white' }}>Days</InputLabel>
        <Select
          multiple
          value={filters.selectedDays || []}
          onChange={(e) => handleChange('selectedDays', e.target.value)}
          input={<OutlinedInput label="Days" />}
          renderValue={(selected) => selected.length === 0 ? 'All Days' : selected.join(', ')}
          sx={{ 
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
          }}
        >
          <MenuItem value="all">
            <Checkbox 
              checked={filters.selectedDays?.length === 0}
              indeterminate={filters.selectedDays?.length > 0 && filters.selectedDays?.length < days.length}
            />
            <ListItemText primary="All Days" />
          </MenuItem>
          {days.map(day => (
            <MenuItem key={day} value={day}>
              <Checkbox checked={filters.selectedDays?.includes(day) || false} />
              <ListItemText primary={day} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default TimeFilter;