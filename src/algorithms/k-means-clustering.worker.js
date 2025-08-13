// Patch environment detection for work-boots in Web Worker context
// Work-boots expects window/document for browser detection, but workers only have 'self'
if (typeof window === 'undefined' && typeof self !== 'undefined') {
  // Make work-boots think we're in a browser by providing minimal window/document
  globalThis.window = self;
  globalThis.document = { }; // Minimal document object
  console.log('Worker: Patched environment for work-boots browser detection');
}

const workbootsExports = require('workboots');
console.log('Worker: Available objects:');
console.log('self.Socks:', self.Socks);
console.log('self.WorkBoots:', self.WorkBoots);
console.log('self.WorkBoots keys:', self.WorkBoots ? Object.keys(self.WorkBoots) : 'undefined');

// Debug environment detection
console.log('Worker environment detection:');
console.log('typeof window:', typeof window);
console.log('typeof document:', typeof document);
console.log('typeof process:', typeof process);
console.log('typeof self:', typeof self);

// Try the nested structure like in main thread - use the same pattern as main thread
const Socks = self.WorkBoots && self.WorkBoots.Socks;

console.log('Worker: About to create Socks instance');
console.log('Worker: Socks constructor:', Socks);
import { Sequence } from './sequencer';
import { kmeans } from './k-means-clustering';
import tinycolor from 'tinycolor2';

// Ensure Socks constructor is available before creating instance
if (!Socks) {
  console.error('Worker: Socks constructor not found! Available objects:', {
    'self.Socks': self.Socks,
    'self.WorkBoots': self.WorkBoots,
    'workbootsExports': workbootsExports
  });
  throw new Error('Socks constructor not available');
}

const socks = new Socks(self);

console.log('Worker: Socks instance created:', socks);

//todo: move this to the Socks class constructor, as a warning for missing socks.ready() call
// easy to do, even if this is cheesy
// Add timeout warning for missing socks.ready() call
let readyCalled = false;
setTimeout(() => {
  if (!readyCalled) {
    console.warn('WARNING: socks.ready() was not called within 3000ms! This may cause communication issues.');
  }
}, 3000);

socks.onMessage(({ data }) => {
  if ('imageData' in data) {
    startClustering(data);
  }
});

const PROGRESS_UPDATE_STEP = 10;
let progressCounter = 0;
const startClustering = ({ imageData, iterations = 10, palletSize = 10, width, height, hsvTolerance = 30, toleranceEnabled = true, distanceMethod = 'hsv-max' }) => {
  progressCounter = 0;
  const hsvArray = [];
  const colors = [];
  for (let i = 0; i < imageData.length; i += 4) {
    // Modify pixel data
    const rgba = tinycolor({
      r: imageData[i + 0],
      g: imageData[i + 1],
      b: imageData[i + 2],
      a: imageData[i + 3]
    });

    const {
      h, s, v
    } = rgba.toHsv();
    hsvArray.push([h,s,v]);
    colors.push({
      x: (i / 4) % width,
      y: Math.floor(i / 4 / width),
      color: rgba.toHexString(),
      hsv: [h,s,v]
    });
  }

  const sequence = new Sequence();

  kmeans(sequence, hsvArray, { iterations, k: palletSize })
    .then(({ centroids, points }) => {
      finished({ centroids, imageData, colors, hsvTolerance, toleranceEnabled, width, height, palletSize, iterations, distanceMethod });
    });

  while (sequence.hasExec()) {
    sequence.exec();
    progressUpdate();
  }
}

const progressUpdate = () => {
  progressCounter++;
  const percentage = Math.min(progressCounter * 2, 99); // Rough progress estimation
  socks.postMessage({ progressUpdate: percentage });
}

const v3distance = (v1, v2) => {
  const x = v1[0] - v2[0];
  const y = v1[1] - v2[1];
  const z = v1[2] - v2[2];
  return Math.pow(x*x + y*y + z*z, 0.5)
}

const finished = ({ centroids, imageData, colors, hsvTolerance = 30, toleranceEnabled = true, width, height, palletSize = 20, iterations = 10, distanceMethod = 'hsv-max' }) => {
  // Convert HSV tolerance from degrees to normalized distance (0-1)
  const normalizedTolerance = hsvTolerance / 360;
  
  let selectedCentroids = [];
  
    if (toleranceEnabled) {
    // First pass: try to find colors that meet the tolerance requirement
    const allCentroids = centroids.map(c => c.location());
    const acceptedColors = [];
    
    console.log(`HSV Tolerance: ${hsvTolerance}° (${(normalizedTolerance * 100).toFixed(1)}% normalized)`);
    console.log(`Distance Method: ${distanceMethod}`);
    console.log(`Total centroids found: ${allCentroids.length}`);
    console.log(`Iterations used: ${iterations}`);
    
    // Temporary debug: If tolerance is too strict, let's see what happens without it
    if (selectedCentroids.length === 0 && toleranceEnabled) {
      console.log(`⚠️  WARNING: No colors passed tolerance filter! Trying without tolerance...`);
      selectedCentroids = allCentroids.slice(0, Math.min(allCentroids.length, palletSize));
      console.log(`📊 Using all ${selectedCentroids.length} centroids without tolerance filtering`);
    }
    
    // Debug: Log all centroids to see if they're converging to similar values
    allCentroids.forEach((centroid, index) => {
      const [h, s, v] = centroid;
      console.log(`Centroid ${index}: HSV(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(v * 100).toFixed(1)}%)`);
    });
    
    // Sort centroids by quality metric (saturation + value, preferring more vibrant colors)
    const sortedCentroids = allCentroids.map((centroid, index) => ({
      centroid,
      index,
      // Quality metric: weighted combination of saturation and value
      // Higher saturation and moderate value = more interesting colors
      quality: (centroid[1] * 0.7) + (centroid[2] * 0.3) // 70% saturation, 30% value
    })).sort((a, b) => b.quality - a.quality);
    
    // First pass: only accept colors that meet tolerance requirements
    for (const { centroid } of sortedCentroids) {
      const [h1, s1, v1] = centroid;
      let meetsTolerance = true;
      
      // Check if this color is far enough from all accepted colors
      for (const acceptedColor of acceptedColors) {
        const distance = calculateColorDistance([h1, s1, v1], acceptedColor, distanceMethod);
        console.log(`  Comparing to accepted color HSV(${acceptedColor[0].toFixed(1)}, ${(acceptedColor[1] * 100).toFixed(1)}%, ${(acceptedColor[2] * 100).toFixed(1)}%): distance=${distance.toFixed(4)}, tolerance=${normalizedTolerance.toFixed(4)}`);
        if (distance < normalizedTolerance) {
          console.log(`  ❌ REJECTED: Too close to accepted color`);
          meetsTolerance = false;
          break;
        }
      }
      
      if (meetsTolerance) {
        acceptedColors.push([h1, s1, v1]);
        selectedCentroids.push(centroid);
        console.log(`  ✅ ACCEPTED: HSV(${h1.toFixed(1)}, ${(s1 * 100).toFixed(1)}%, ${(v1 * 100).toFixed(1)}%)`);
      } else {
        console.log(`  ❌ REJECTED: HSV(${h1.toFixed(1)}, ${(s1 * 100).toFixed(1)}%, ${(v1 * 100).toFixed(1)}%)`);
      }
    }
    
    console.log(`First pass: ${selectedCentroids.length} colors accepted out of ${allCentroids.length} total`);
    
    // If we don't have enough colors, do a second pass with fallback strategy
    if (selectedCentroids.length < allCentroids.length) {
      console.log(`Need more colors. Starting fallback strategy...`);
      
      const remainingCentroids = sortedCentroids.filter(({ centroid }) => {
        return !selectedCentroids.some(selected => 
          calculateColorDistance(centroid, selected, distanceMethod) < normalizedTolerance
        );
      });
      
      console.log(`Remaining centroids for fallback: ${remainingCentroids.length}`);
      
      // Sort remaining colors by distance from the mean of accepted colors
      if (acceptedColors.length > 0) {
        const meanH = acceptedColors.reduce((sum, [h]) => sum + h, 0) / acceptedColors.length;
        const meanS = acceptedColors.reduce((sum, [, s]) => sum + s, 0) / acceptedColors.length;
        const meanV = acceptedColors.reduce((sum, [, , v]) => sum + v, 0) / acceptedColors.length;
        const meanColor = [meanH, meanS, meanV];
        
        remainingCentroids.sort((a, b) => {
          const distanceA = calculateColorDistance(a.centroid, meanColor, distanceMethod);
          const distanceB = calculateColorDistance(b.centroid, meanColor, distanceMethod);
          return distanceB - distanceA; // Sort by distance from mean (farthest first)
        });
      }
      
      // Add remaining colors until we reach the target palette size or run out
      const targetSize = Math.min(allCentroids.length, palletSize);
      console.log(`Target palette size: ${targetSize}`);
      
      for (const { centroid } of remainingCentroids) {
        if (selectedCentroids.length >= targetSize) break;
        const [h, s, v] = centroid;
        selectedCentroids.push(centroid);
        console.log(`Fallback accepted: HSV(${h.toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(v * 100).toFixed(1)}%)`);
      }
    }
    
    console.log(`Final palette: ${selectedCentroids.length} colors selected`);
  } else {
    // If tolerance is disabled, use all centroids
    selectedCentroids = centroids.map(c => c.location());
  }

  const graphNodes = selectedCentroids
    .map(c => {
      const [h,s,v] = c;
      const centroidHSV = [h,s,v];
      const color = tinycolor({ h,s,v }).toHexString();
      
      // Find the largest connected area for this color
      const example = findLargestColorArea(colors, centroidHSV, width, height, distanceMethod);
      
      if (!example) {
        console.log(`unable to find color example for color: ${color}`);
        return undefined;
      }
      return {
        x: example.x,
        y: example.y,
        color: color
      };
    })
    .filter(c => !!c);

  socks.postMessage({ graphNodes });
}

// Helper function to convert HSV to 3D vector for angle calculations
const hsvToVector = (h, s, v) => {
  // Convert HSV to 3D vector representation
  // H: angle around the circle (0-360)
  // S: radius from center (0-1)
  // V: height (0-1)
  const hRadians = (h * Math.PI) / 180;
  const x = s * Math.cos(hRadians);
  const y = s * Math.sin(hRadians);
  const z = v;
  return [x, y, z];
}

// HSV distance calculation using weighted components
const hsvDistance = (hsv1, hsv2) => {
  const [h1, s1, v1] = hsv1;
  const [h2, s2, v2] = hsv2;
  
  // Handle hue wrapping (0 and 360 are the same)
  let hDiff = Math.abs(h1 - h2);
  if (hDiff > 180) {
    hDiff = 360 - hDiff;
  }
  
  // Weighted distance calculation
  const hWeight = 1.0;
  const sWeight = 1.0;
  const vWeight = 1.0;
  
  const hDist = (hDiff / 180) * hWeight;
  const sDist = Math.abs(s1 - s2) * sWeight;
  const vDist = Math.abs(v1 - v2) * vWeight;
  
  return Math.sqrt(hDist * hDist + sDist * sDist + vDist * vDist);
}

// HSL distance calculation using weighted components
const hslDistance = (hsl1, hsl2) => {
  const [h1, s1, l1] = hsl1;
  const [h2, s2, l2] = hsl2;
  
  // Handle hue wrapping (0 and 360 are the same)
  let hDiff = Math.abs(h1 - h2);
  if (hDiff > 180) {
    hDiff = 360 - hDiff;
  }
  
  // Weighted distance calculation
  const hWeight = 1.0;
  const sWeight = 1.0;
  const lWeight = 1.0;
  
  const hDist = (hDiff / 180) * hWeight;
  const sDist = Math.abs(s1 - s2) * sWeight;
  const lDist = Math.abs(l1 - l2) * lWeight;
  
  return Math.sqrt(hDist * hDist + sDist * sDist + lDist * lDist);
}

// Universal distance calculation function that handles all methods
const calculateColorDistance = (color1, color2, method) => {
  switch (method) {
    case 'hsv-max':
      return hsvDistance(color1, color2);
    case 'hsv-avg':
      return hsvDistance(color1, color2);
    case 'hsl-max':
      // Convert HSV to HSL for comparison
      const color1HSL = tinycolor({ h: color1[0], s: color1[1], v: color1[2] }).toHsl();
      const color2HSL = tinycolor({ h: color2[0], s: color2[1], v: color2[2] }).toHsl();
      return hslDistance([color1HSL.h, color1HSL.s, color1HSL.l], [color2HSL.h, color2HSL.s, color2HSL.l]);
    case 'hsl-avg':
      // Convert HSV to HSL for comparison
      const color1HSL_avg = tinycolor({ h: color1[0], s: color1[1], v: color1[2] }).toHsl();
      const color2HSL_avg = tinycolor({ h: color2[0], s: color2[1], v: color2[2] }).toHsl();
      return hslDistance([color1HSL_avg.h, color1HSL_avg.s, color1HSL_avg.l], [color2HSL_avg.h, color2HSL_avg.s, color2HSL_avg.l]);
    case 'max-hsv-hsl':
      // Calculate both HSV and HSL distances, return the maximum
      const hsvDist = hsvDistance(color1, color2);
      const color1HSL_max = tinycolor({ h: color1[0], s: color1[1], v: color1[2] }).toHsl();
      const color2HSL_max = tinycolor({ h: color2[0], s: color2[1], v: color2[2] }).toHsl();
      const hslDist = hslDistance([color1HSL_max.h, color1HSL_max.s, color1HSL_max.l], [color2HSL_max.h, color2HSL_max.s, color2HSL_max.l]);
      const maxDist = Math.max(hsvDist, hslDist);
      console.log(`    Max(HSV, HSL): HSV=${hsvDist.toFixed(4)}, HSL=${hslDist.toFixed(4)}, Max=${maxDist.toFixed(4)}`);
      return maxDist;
    default:
      return hsvDistance(color1, color2);
  }
}

// Helper function to find the largest connected area for a color
const findLargestColorArea = (colors, targetHSV, width, height, distanceMethod = 'hsv-max') => {
  const tolerance = 0.15; // Color similarity tolerance
  const visited = new Set();
  let largestArea = null;
  let maxArea = 0;
  
  for (let i = 0; i < colors.length; i++) {
    if (visited.has(i)) continue;
    
    const color = colors[i];
    const distance = calculateColorDistance(targetHSV, color.hsv, distanceMethod);
    
    if (distance <= tolerance) {
      // Found a matching color, flood fill to find connected area
      const area = floodFill(colors, i, targetHSV, tolerance, width, height, visited, distanceMethod);
      
      if (area.pixels.length > maxArea) {
        maxArea = area.pixels.length;
        largestArea = area;
      }
    }
  }
  
  return largestArea ? largestArea.centroid : null;
}

// Flood fill algorithm to find connected areas
const floodFill = (colors, startIndex, targetHSV, tolerance, width, height, visited, distanceMethod = 'hsv-max') => {
  const stack = [startIndex];
  const pixels = [];
  let sumX = 0, sumY = 0;
  
  while (stack.length > 0) {
    const index = stack.pop();
    if (visited.has(index)) continue;
    
    visited.add(index);
    const color = colors[index];
    const distance = calculateColorDistance(targetHSV, color.hsv, distanceMethod);
    
    if (distance <= tolerance) {
      pixels.push(color);
      sumX += color.x;
      sumY += color.y;
      
      // Add neighboring pixels (4-connected for better performance)
      const x = color.x;
      const y = color.y;
      
      // Check 4-connected neighbors (faster than 8-connected)
      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];
      
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const neighborIndex = ny * width + nx;
          if (!visited.has(neighborIndex)) {
            stack.push(neighborIndex);
          }
        }
      }
    }
  }
  
  return {
    pixels,
    centroid: pixels.length > 0 ? {
      x: Math.round(sumX / pixels.length),
      y: Math.round(sumY / pixels.length)
    } : null
  };
}

socks.ready();
readyCalled = true;

export {
  socks
};
