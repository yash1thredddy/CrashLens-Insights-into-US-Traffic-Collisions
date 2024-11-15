// src/constants/index.js
export const MAPBOX_TOKEN = 'pk.eyJ1IjoieWFzaDF0aDI2IiwiYSI6ImNtM2ZtcGh4aTBydm4yaXBxYmdheWZ2dDMifQ.lJeCVwpFdD4gFtfqutyLGw';

export const INITIAL_VIEW_STATE = {
  latitude: 37.8,
  longitude: -96,
  zoom: 3.5,
  pitch: 45,
  bearing: 0
};

export const MAP_STYLES = {
  MAPBOX: 'mapbox://styles/mapbox/satellite-v9',
  OSM: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
};

export const COLOR_SCALE = [
  [65, 182, 196],    // Light blue
  [127, 205, 187],   // Turquoise
  [199, 233, 180],   // Light green
  [237, 248, 177],   // Yellow
  [255, 237, 160],   // Light yellow
  [255, 255, 204]    // Pale yellow
];

export const SEVERITY_COLORS = {
  1: [65, 182, 196],    // Light blue
  2: [127, 205, 187],   // Turquoise
  3: [199, 233, 180],   // Light green
  4: [237, 248, 177],   // Yellow
  5: [255, 237, 160]    // Light yellow
};

export const HEXAGON_LAYER_SETTINGS = {
  colorRange: [
    [255, 255, 178],
    [254, 217, 118],
    [254, 178, 76],
    [253, 141, 60],
    [252, 78, 42],
    [227, 26, 28]
  ],
  coverage: 0.8,
  elevationRange: [0, 3000],
  elevationScale: 100,
  extruded: true,
  radius: 20000,
  upperPercentile: 90,
  material: {
    ambient: 0.64,
    diffuse: 0.6,
    shininess: 32,
    specularColor: [51, 51, 51]
  }
};