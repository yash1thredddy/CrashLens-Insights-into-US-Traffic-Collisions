// src/utils/colorUtils.js
/**
 * Color utility functions for map visualization
 */
export const colorUtils = {
  // Get color for severity
  getSeverityColor: (severity) => {
    const colors = {
      1: [65, 182, 196],    // Light blue
      2: [127, 205, 187],   // Turquoise
      3: [199, 233, 180],   // Light green
      4: [237, 248, 177],   // Yellow
      5: [255, 255, 204]    // Light yellow
    };
    return colors[severity] || colors[1];
  },

  // Get color for heatmap intensity
  getIntensityColor: (value, maxValue) => {
    const ratio = value / maxValue;
    return [
      255 * ratio,
      140 * (1 - ratio),
      0,
      255 * Math.min(ratio + 0.2, 1)
    ];
  },

  // Generate color scale for legend
  generateColorScale: (steps = 5) => {
    return Array.from({ length: steps }, (_, i) => {
      const ratio = i / (steps - 1);
      return colorUtils.getIntensityColor(ratio, 1);
    });
  },

  // Color interpolation
  interpolateColors: (color1, color2, steps) => {
    const stepFactor = 1 / (steps - 1);
    return Array.from({ length: steps }, (_, i) => {
      const factor = stepFactor * i;
      return [
        Math.round(color1[0] + (color2[0] - color1[0]) * factor),
        Math.round(color1[1] + (color2[1] - color1[1]) * factor),
        Math.round(color1[2] + (color2[2] - color1[2]) * factor)
      ];
    });
  },

  // Convert RGB to hex
  rgbToHex: ([r, g, b]) => {
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  },

  // Convert hex to RGB
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }
};