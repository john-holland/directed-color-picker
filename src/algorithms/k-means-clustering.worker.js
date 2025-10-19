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

// Progressive quad-based downsampling with centroid convergence testing and streaming
const startClustering = async ({ imageData, iterations = 10, palletSize = 10, width, height, hsvTolerance = 30, toleranceEnabled = true, distanceMethod = 'hsv-max' }) => {
  progressCounter = 0;
  
  console.log(`Starting progressive clustering: ${width}x${height} image, ${palletSize} colors, ${iterations} max iterations`);
  
  // Define resolution levels: [quadSize, description, maxIterations]
  // Mobile devices get fewer iterations for faster processing and limited quad sizes
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const mobileIterations = Math.max(2, Math.floor(iterations / 2)); // Half iterations for mobile
  
  // Mobile devices skip fine-grained processing (min 4x4 quads) for better performance
  const resolutionLevels = isMobile ? [
    [8, '8x8 quads', mobileIterations],
    [6, '6x6 quads', mobileIterations],
    [4, '4x4 quads', mobileIterations]
  ] : [
    [8, '8x8 quads', iterations],
    [6, '6x6 quads', iterations],
    [4, '4x4 quads', iterations],
    [2, '2x2 quads', iterations],
    [1, '1x1 pixels', iterations]
  ];
  
  let currentCentroids = null;
  let previousCentroids = null;
  // Mobile devices get a higher convergence threshold for faster processing
  let convergenceThreshold = isMobile ? 0.03 : 0.01; // Higher threshold for mobile
  
  // Send initial progress
  socks.postMessage({ 
    progressUpdate: 0,
    status: 'Starting progressive clustering...'
  });
  
  // Add streaming delay function for mobile devices
  const streamingDelay = (customDelay = null) => {
    if (isMobile) {
      const delay = customDelay || 50; // Default 50ms, but can be customized
      return new Promise(resolve => setTimeout(resolve, delay));
    }
    return Promise.resolve();
  };
  
  // Log mobile-specific optimizations
  if (isMobile) {
    console.log('📱 Mobile device detected - using optimized settings:');
    console.log(`   - Min quad size: 4x4 (skipping 2x2 and 1x1 for performance)`);
    console.log(`   - Max iterations: ${mobileIterations} (vs ${iterations} on desktop)`);
    console.log(`   - Resolution levels: ${resolutionLevels.length} (vs 5 on desktop)`);
  }
  
  // Process each resolution level with streaming
  for (const [quadSize, description, maxIterations] of resolutionLevels) {
    console.log(`Processing at ${description} resolution with max ${maxIterations} iterations...`);
    
    // Send progress update for current resolution
    socks.postMessage({ 
      progressUpdate: Math.round((resolutionLevels.findIndex(([size]) => size === quadSize) / resolutionLevels.length) * 20),
      status: `Processing ${description} resolution...`
    });
    
    // Add streaming delay for mobile
    await streamingDelay();
    
    // Downsample image data to current resolution
    const { downsampledData, downsampledWidth, downsampledHeight } = downsampleImage(imageData, width, height, quadSize);
   
    console.log(`Downsampled to ${downsampledWidth}x${downsampledHeight} (${downsampledData.length / 4} pixels)`);
    
    // Convert to HSV arrays with streaming
    const hsvArray = [];
    const colors = [];
    // Mobile devices get smaller chunks for better responsiveness
    const chunkSize = isMobile ? 500 : 5000; // Smaller chunks for mobile
    
    for (let i = 0; i < downsampledData.length; i += 4) {
      const rgba = tinycolor({
        r: downsampledData[i + 0],
        g: downsampledData[i + 1],
        b: downsampledData[i + 2],
        a: downsampledData[i + 3]
      });

      const { h, s, v } = rgba.toHsv();
      hsvArray.push([h, s, v]);
      colors.push({
        x: (i / 4) % downsampledWidth,
        y: Math.floor(i / 4 / downsampledWidth),
        color: rgba.toHexString(),
        hsv: [h, s, v]
      });
      
      // Streaming yield point for mobile devices
      if (isMobile && (i / 4) % chunkSize === 0) {
        await streamingDelay();
      }
    }
    
    // Run k-means clustering at current resolution
    const sequence = new Sequence();
    
    try {
      // For now, use direct fallback approach until we fix the sequencer issue
      console.log(`Using direct k-means fallback for ${hsvArray.length} pixels, ${palletSize} colors`);
      const centroids = createAdvancedCentroids(hsvArray, palletSize);
      const points = []; // We don't need points for the current use case
      
      console.log(`Clustering at ${description} completed:`, { 
        centroidsCount: centroids?.length || 0, 
        pointsCount: points?.length || 0
      });
     
      // Check for centroid convergence
      if (previousCentroids && currentCentroids) {
        const convergenceScore = calculateCentroidConvergence(previousCentroids, centroids);
        console.log(`Convergence score at ${description}: ${convergenceScore.toFixed(4)} (threshold: ${convergenceThreshold})`);
        
        if (convergenceScore < convergenceThreshold) {
          console.log(`✅ Centroids converged at ${description} resolution! Stopping early.`);
          currentCentroids = centroids;
          break;
        }
      }
      
      // Store centroids for next iteration
      previousCentroids = currentCentroids;
      currentCentroids = centroids;
      
      // Convert centroids to hex colors for processing palette preview
      const processingColors = centroids && centroids.length > 0 ? centroids.map(centroid => {
        const [h, s, v] = centroid.location(); // Call location() method to get HSV values
        const hexColor = tinycolor({ h, s, v }).toHexString();
        return {
          color: hexColor,
          x: Math.random() * width,
          y: Math.random() * height,
          phase: description
        };
      }) : [];
      
      // Update progress with detailed information and processing palette
      const levelIndex = resolutionLevels.findIndex(([size]) => size === quadSize);
      const progress = Math.round(((levelIndex + 1) / resolutionLevels.length) * 80); // 80% for resolution processing
      
      console.log(`📊 Sending ${processingColors.length} processing colors for ${description}`);
      
      socks.postMessage({ 
        progressUpdate: progress,
        status: `Completed ${description} (${downsampledWidth}x${downsampledHeight} pixels)`,
        processingPalette: processingColors
      });
     
    } catch (error) {
      console.error(`Error clustering at ${description} resolution:`, error);
      // Continue to next resolution level
      continue;
    }
  }
  
  // Process final results
   if (currentCentroids) {
     console.log('Processing final clustering results...');
     
     // Send final progress update
     socks.postMessage({ 
       progressUpdate: 100,
       status: `Clustering complete! Found ${currentCentroids.length} colors`
     });
     
     // Send progress update for final processing
     socks.postMessage({ 
       progressUpdate: 85,
       status: 'Generating final color data...'
     });
     
     // Regenerate colors at full resolution for final processing with streaming
     const fullResolutionColors = [];
     // Mobile devices get much smaller chunks for better responsiveness during final processing
     const finalChunkSize = isMobile ? 500 : 10000; // Much smaller chunks for mobile
     
     console.log(`📱 Mobile: Processing ${imageData.length / 4} pixels with chunk size ${finalChunkSize}`);
     
     for (let i = 0; i < imageData.length; i += 4) {
       const rgba = tinycolor({
         r: imageData[i + 0],
         g: imageData[i + 1],
         b: imageData[i + 2],
         a: imageData[i + 3]
       });

       const { h, s, v } = rgba.toHsv();
       fullResolutionColors.push({
         x: (i / 4) % width,
         y: Math.floor(i / 4 / width),
         color: rgba.toHexString(),
         hsv: [h, s, v]
       });
       
               // Streaming yield point for mobile devices - much more frequent with shorter delays
        if (isMobile && (i / 4) % finalChunkSize === 0) {
          await streamingDelay(25); // Shorter delay for final processing
          
          // Send incremental progress updates for mobile
          const progress = 85 + Math.round((i / imageData.length) * 10);
          socks.postMessage({ 
            progressUpdate: progress,
            status: `Mobile: Processing pixels ${Math.round((i / imageData.length) * 100)}%`
          });
        }
     }
     
     // Send final progress update
     socks.postMessage({ 
       progressUpdate: 95,
       status: 'Finalizing clustering results...'
     });
     
     // Add final streaming delay for mobile
     await streamingDelay();
     
     finished({ 
       centroids: currentCentroids, 
       imageData, 
       colors: fullResolutionColors, // Full resolution colors for example finding
       hsvTolerance, 
       toleranceEnabled, 
       width, 
       height, 
       palletSize, 
       iterations, 
       distanceMethod 
     });
   } else {
     console.error('No centroids generated from clustering');
     socks.postMessage({ error: 'Clustering failed to generate centroids' });
   }
};

// Downsample image data by averaging pixels in quad regions
const downsampleImage = (imageData, width, height, quadSize) => {
  const downsampledWidth = Math.ceil(width / quadSize);
  const downsampledHeight = Math.ceil(height / quadSize);
  const downsampledData = new Uint8ClampedArray(downsampledWidth * downsampledHeight * 4);
  
  for (let dy = 0; dy < downsampledHeight; dy++) {
    for (let dx = 0; dx < downsampledWidth; dx++) {
      const sx = dx * quadSize;
      const sy = dy * quadSize;
      
      let r = 0, g = 0, b = 0, a = 0;
      let pixelCount = 0;
      
      // Average pixels in the quad region
      for (let qy = 0; qy < quadSize && sy + qy < height; qy++) {
        for (let qx = 0; qx < quadSize && sx + qx < width; qx++) {
          const sourceIndex = ((sy + qy) * width + (sx + qx)) * 4;
          r += imageData[sourceIndex];
          g += imageData[sourceIndex + 1];
          b += imageData[sourceIndex + 2];
          a += imageData[sourceIndex + 3];
          pixelCount++;
        }
      }
      
      // Calculate average and store in downsampled data
      const destIndex = (dy * downsampledWidth + dx) * 4;
      downsampledData[destIndex] = Math.round(r / pixelCount);
      downsampledData[destIndex + 1] = Math.round(g / pixelCount);
      downsampledData[destIndex + 2] = Math.round(b / pixelCount);
      downsampledData[destIndex + 3] = Math.round(a / pixelCount);
    }
  }
  
  return { downsampledData, downsampledWidth, downsampledHeight };
};

// Create fallback centroids if k-means fails
const createFallbackCentroids = (hsvArray, k) => {
  console.log(`Creating fallback centroids for ${k} colors from ${hsvArray.length} data points`);
  
  // Simple approach: sample evenly distributed colors from the data
  const step = Math.max(1, Math.floor(hsvArray.length / k));
  const centroids = [];
  
  for (let i = 0; i < k && i * step < hsvArray.length; i++) {
    const index = i * step;
    const hsv = hsvArray[index];
    
    // Create a mock centroid object with the expected interface
    const centroid = {
      location: () => hsv,
      label: () => i
    };
    
    centroids.push(centroid);
  }
  
  console.log(`Created ${centroids.length} fallback centroids`);
  return centroids;
};

// Create advanced centroids using a simplified k-means approach
const createAdvancedCentroids = (hsvArray, k) => {
  console.log(`Creating advanced centroids for ${k} colors from ${hsvArray.length} data points`);
  
  if (hsvArray.length === 0) {
    return [];
  }
  
  // Initialize centroids with evenly distributed samples
  const step = Math.max(1, Math.floor(hsvArray.length / k));
  let centroids = [];
  
  for (let i = 0; i < k && i * step < hsvArray.length; i++) {
    const index = i * step;
    centroids.push([...hsvArray[index]]); // Copy HSV values
  }
  
  // If we don't have enough centroids, fill with random samples
  while (centroids.length < k && hsvArray.length > 0) {
    const randomIndex = Math.floor(Math.random() * hsvArray.length);
    centroids.push([...hsvArray[randomIndex]]);
  }
  
  // Perform a few iterations of k-means
  const maxIterations = 3;
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroids
    const clusters = Array(k).fill().map(() => []);
    
    for (const point of hsvArray) {
      let nearestCentroid = 0;
      let minDistance = Infinity;
      
      for (let c = 0; c < centroids.length; c++) {
        const distance = hsvDistance(point, centroids[c]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = c;
        }
      }
      
      clusters[nearestCentroid].push(point);
    }
    
    // Update centroids to cluster means
    for (let c = 0; c < centroids.length; c++) {
      if (clusters[c].length > 0) {
        const sumH = clusters[c].reduce((sum, p) => sum + p[0], 0);
        const sumS = clusters[c].reduce((sum, p) => sum + p[1], 0);
        const sumV = clusters[c].reduce((sum, p) => sum + p[2], 0);
        
        centroids[c] = [
          sumH / clusters[c].length,
          sumS / clusters[c].length,
          sumV / clusters[c].length
        ];
      }
    }
  }
  
  // Convert to expected centroid object format
  const result = centroids.map((hsv, index) => ({
    location: () => hsv,
    label: () => index
  }));
  
  console.log(`Created ${result.length} advanced centroids`);
  return result;
};

// Calculate convergence between two sets of centroids
const calculateCentroidConvergence = (centroids1, centroids2) => {
  console.log('Calculating convergence between:', { 
    centroids1: centroids1?.length || 0, 
    centroids2: centroids2?.length || 0 
  });
  
  if (!centroids1 || !centroids2 || centroids1.length !== centroids2.length) {
    console.log('Convergence check failed - centroids mismatch');
    return Infinity; // No convergence if centroids don't match
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < centroids1.length; i++) {
    const loc1 = centroids1[i].location();
    const loc2 = centroids2[i].location();
    
    console.log(`Centroid ${i}:`, { loc1, loc2 });
    
    // Calculate Euclidean distance in HSV space
    const hDiff = Math.abs(loc1[0] - loc2[0]) / 360; // Normalize hue difference
    const sDiff = Math.abs(loc1[1] - loc2[1]);
    const vDiff = Math.abs(loc1[2] - loc2[2]);
    
    const distance = Math.sqrt(hDiff * hDiff + sDiff * sDiff + vDiff * vDiff);
    totalDistance += distance;
  }
  
  const avgDistance = totalDistance / centroids1.length;
  console.log(`Convergence calculation: totalDistance=${totalDistance}, avgDistance=${avgDistance}`);
  return avgDistance; // Average distance
};

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
      console.log(`    Max(HSV, HSL): HSV=${hsvDist.toFixed(4)}, HSL=${hsvDist.toFixed(4)}, Max=${maxDist.toFixed(4)}`);
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
