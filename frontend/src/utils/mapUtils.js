// src/utils/mapUtils.js
/**
 * Map utility functions for viewport and data manipulation
 */
export const mapUtils = {
  // Convert coordinates to viewport
  coordinatesToViewport: (coordinates, padding = 20) => {
    const [minLng, minLat, maxLng, maxLat] = coordinates;
    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: getBoundsZoomLevel([minLng, minLat], [maxLng, maxLat], padding)
    };
  },

  // Get bounds for a state
  getStateBounds: (stateData) => {
    if (!stateData) return null;
    return {
      minLng: stateData.min_lng,
      minLat: stateData.min_lat,
      maxLng: stateData.max_lng,
      maxLat: stateData.max_lat
    };
  },

  // Calculate zoom level for bounds
  getBoundsZoomLevel: (bounds, width, height, padding) => {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;
    const lngDiff = ne.lng() - sw.lng();
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = zoom(height, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
  },

  // Format popup content
  formatPopupContent: (data) => {
    if (!data) return null;
    return {
      title: data.state || data.county,
      content: [
        { label: 'Accidents', value: data.accident_count.toLocaleString() },
        { label: 'Severity', value: data.avg_severity?.toFixed(2) }
      ]
    };
  },

  // Helper to check if point is in bounds
  isPointInBounds: (point, bounds) => {
    return point.lng >= bounds.minLng &&
           point.lng <= bounds.maxLng &&
           point.lat >= bounds.minLat &&
           point.lat <= bounds.maxLat;
  }
};