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

const TimeFilter = ({ filters, onChange, sx = {} }) => {
  const years = Array.from({ length: 8 }, (_, i) => 2016 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

const handleChange = (field, value) => {
  // If we're viewing day of week analysis, don't update calendar days
  if (field === 'selectedDays' && filters.selectedDayOfWeek) {
    return;
  }

  const newFilters = {
    ...filters,
    [field]: value
  };
  onChange(newFilters);
};

  const getMonthName = (month) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        padding: 3,
        borderRadius: 2,
        color: 'white',
        width: 300,
        backdropFilter: 'blur(8px)',
        ...sx
      }}
    >
      <Typography variant="h6" gutterBottom>
        Time Filters
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: 'white' }}>Years</InputLabel>
        <Select
          multiple
          value={filters.selectedYears || []}
          onChange={(e) => handleChange('selectedYears', e.target.value)}
          input={<OutlinedInput label="Years" />}
          renderValue={(selected) => selected.join(', ')}
          sx={{ 
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' }
          }}
        >
          {years.map(year => (
            <MenuItem key={year} value={year}>
              <Checkbox checked={filters.selectedYears?.includes(year) || false} />
              <ListItemText primary={year} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: 'white' }}>Months</InputLabel>
        <Select
          multiple
          value={filters.selectedMonths || []}
          onChange={(e) => handleChange('selectedMonths', e.target.value)}
          input={<OutlinedInput label="Months" />}
          renderValue={(selected) => selected.map(month => getMonthName(month)).join(', ')}
          sx={{ color: 'white' }}
        >
          {months.map(month => (
            <MenuItem key={month} value={month}>
              <Checkbox checked={filters.selectedMonths?.includes(month) || false} />
              <ListItemText primary={getMonthName(month)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: 'white' }}>Days</InputLabel>
        <Select
          multiple
          value={filters.selectedDays || []}
          onChange={(e) => handleChange('selectedDays', e.target.value)}
          input={<OutlinedInput label="Days" />}
          renderValue={(selected) => selected.join(', ')}
          sx={{ color: 'white' }}
        >
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