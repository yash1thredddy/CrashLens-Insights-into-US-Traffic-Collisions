// src/hooks/useViewport.js
import { useState } from 'react';
import { INITIAL_VIEW_STATE } from '../constants';

export const useViewport = () => {
  const [viewport, setViewport] = useState(INITIAL_VIEW_STATE);

  const fitBounds = (bounds) => {
    // Implement bounds fitting logic here
    // This will update the viewport to fit the selected state/region
  };

  return { viewport, setViewport, fitBounds };
};