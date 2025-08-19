/**
 * Utility functions for image processing and color detection testing
 */

/**
 * Convert RGB values to hex color string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Convert hex color string to RGB values
 * @param {string} hex - Hex color string
 * @returns {Object} Object with r, g, b properties
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate color distance using Euclidean distance in RGB space
 * @param {Object} color1 - First color with r, g, b properties
 * @param {Object} color2 - Second color with r, g, b properties
 * @returns {number} Distance between colors
 */
export function colorDistance(color1, color2) {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Check if two colors are within tolerance
 * @param {Object} color1 - First color with r, g, b properties
 * @param {Object} color2 - Second color with r, g, b properties
 * @param {number} tolerance - Maximum allowed distance
 * @returns {boolean} True if colors are within tolerance
 */
export function colorsWithinTolerance(color1, color2, tolerance = 30) {
  return colorDistance(color1, color2) <= tolerance;
}

/**
 * Find the closest color from a palette
 * @param {Object} targetColor - Target color with r, g, b properties
 * @param {Array} palette - Array of colors with r, g, b properties
 * @returns {Object} Closest color and its distance
 */
export function findClosestColor(targetColor, palette) {
  let closest = null;
  let minDistance = Infinity;

  palette.forEach(color => {
    const distance = colorDistance(targetColor, color);
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  });

  return { color: closest, distance: minDistance };
}

/**
 * Extract dominant colors from image data using simple sampling
 * @param {Uint8ClampedArray} imageData - Image pixel data
 * @param {number} sampleRate - How many pixels to skip (higher = faster)
 * @returns {Array} Array of dominant colors
 */
export function extractDominantColors(imageData, sampleRate = 10) {
  const colors = [];
  
  for (let i = 0; i < imageData.length; i += sampleRate * 4) {
    if (i + 2 < imageData.length) {
      colors.push({
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2]
      });
    }
  }
  
  return colors;
}

/**
 * Group similar colors together
 * @param {Array} colors - Array of colors
 * @param {number} tolerance - Color similarity tolerance
 * @returns {Array} Array of color groups
 */
export function groupSimilarColors(colors, tolerance = 30) {
  const groups = [];
  
  colors.forEach(color => {
    let addedToGroup = false;
    
    for (const group of groups) {
      if (group.some(groupColor => colorsWithinTolerance(color, groupColor, tolerance))) {
        group.push(color);
        addedToGroup = true;
        break;
      }
    }
    
    if (!addedToGroup) {
      groups.push([color]);
    }
  });
  
  return groups;
}

/**
 * Calculate average color from a group of colors
 * @param {Array} colorGroup - Array of colors
 * @returns {Object} Average color
 */
export function calculateAverageColor(colorGroup) {
  if (colorGroup.length === 0) return { r: 0, g: 0, b: 0 };
  
  const sum = colorGroup.reduce((acc, color) => ({
    r: acc.r + color.r,
    g: acc.g + color.g,
    b: acc.b + color.b
  }), { r: 0, g: 0, b: 0 });
  
  return {
    r: Math.round(sum.r / colorGroup.length),
    g: Math.round(sum.g / colorGroup.length),
    b: Math.round(sum.b / colorGroup.length)
  };
}

