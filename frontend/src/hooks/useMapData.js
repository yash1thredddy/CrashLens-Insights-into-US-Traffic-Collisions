// src/hooks/useMapData.js
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export const useMapData = (filters) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/spatial/map-data', {
          params: {
            year: filters.year,
            month: filters.month
          },
          signal: abortControllerRef.current.signal
        });
        
        console.log('Fetched map data:', response.data); // Log fetched data

        setData(response.data);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error fetching data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filters.year, filters.month]); // Only re-fetch for year/month changes

  return { data, loading };
};
