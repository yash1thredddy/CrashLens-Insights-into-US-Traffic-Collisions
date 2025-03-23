// src/services/api.js
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

export const getMapData = async (params) => {
  try {
    const response = await axios.get(`${BASE_URL}/spatial/map-data`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching map data:', error);
    throw error;
  }
};