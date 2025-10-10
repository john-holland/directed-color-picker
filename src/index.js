import d3_force from 'd3-force';
import d3 from 'd3';
import tinycolor from 'tinycolor2';
import clusters from 'clusters';
import { createGraph, generateChart } from './chart.js';
import { interpret } from 'xstate';
import { paletteStateMachine } from './state/paletteStateMachine.js';
import { PaletteManager } from './business/paletteManager.js';
import { UIController } from './view/uiController.js';

const workbootsExports = require('workboots');
console.log('Constructor found! Using window.WorkBoots.WorkBoots');
const WorkBoots = window.WorkBoots.WorkBoots;

// Temporarily comment out RobotCopy and ViewStateMachine to test color picker
// const robotCopy = new RobotCopy({
//   enableTracing: false,
//   enableDataDog: false,
//   nodeBackendUrl: null, // Disable external API calls
//   kotlinBackendUrl: null
// });

// const paletteStateMachine = createViewStateMachine({
//   machineId: 'palette-manager',
//   xstateConfig: {
//     id: 'palette-manager',
//     initial: 'idle',
//     context: {
//       currentPalette: [],
//       savedPalettes: [],
//       selectedColors: []
//     },
//     states: {
//       idle: {
//         on: {
//           PALETTE_GENERATED: 'palette-ready',
//           PALETTE_LOADED: 'palette-ready'
//         }
//       },
//       'palette-ready': {
//         on: {
//           COPY_PALETTE: 'copying',
//           EDIT_PALETTE: 'editing',
//           SAVE_PALETTE: 'saving'
//         }
//       },
//       copying: {
//         on: {
//           COPY_COMPLETE: 'palette-ready'
//         }
//       },
//       editing: {
//         on: {
//           COLOR_ADDED: 'palette-ready',
//           COLOR_REMOVED: 'palette-ready',
//           PALETTE_RESET: 'palette-ready'
//         }
//       },
//       saving: {
//         on: {
//           SAVE_COMPLETE: 'palette-ready'
//         }
//       }
//     }
//   }
// });

// Initialize palette management system
let savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]');
let selectedColors = [];
let originalPalette = []; // Store original palette for reset functionality

// Separate palette arrays
let mainPalette = []; // Main palette below the image (original generated colors)
let workingPalette = []; // Working palette in the management section (for experiments)

// Initialize state machines and business logic
const paletteService = interpret(paletteStateMachine);
const paletteManager = new PaletteManager(paletteService);
let uiController = null; // Will be initialized after DOM is ready

// Start the palette state machine
paletteService.onTransition(state => {
  console.log('Palette State:', state.value, state.context);
});

paletteService.start();

// Check WebP and AVIF support
function checkWebPSupport() {
  const webp = new Image();
  webp.onload = webp.onerror = function() {
    const isSupported = webp.height === 2;
    console.log(`WebP support: ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
    if (isSupported) {
      console.log('🎉 WebP images will be processed with excellent compression and quality!');
    } else {
      console.log('⚠️ WebP images may not display correctly in this browser');
    }
  };
  webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bAISLQBgSShTYgS5TQAA';
}

function checkAVIFSupport() {
  const avif = new Image();
  avif.onload = avif.onerror = function() {
    const isSupported = avif.height === 2;
    console.log(`AVIF support: ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
    if (isSupported) {
      console.log('🎉 AVIF images will be processed with excellent compression and quality!');
    } else {
      console.log('⚠️ AVIF images may not display correctly in this browser');
    }
  };
  avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAcAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
}

// Check if device is mobile
function isMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Check for mobile indicators
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUserAgent = mobileRegex.test(userAgent);
  
  // Check for touch capability
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size (additional check for tablets)
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check for mobile-specific features
  const isMobileFeatures = 'orientation' in window && 'onorientationchange' in window;
  
  console.log('Mobile detection:', {
    userAgent: userAgent,
    isMobileUserAgent,
    isTouchDevice,
    isSmallScreen,
    isMobileFeatures,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight
  });
  
  return isMobileUserAgent || (isTouchDevice && isSmallScreen) || isMobileFeatures;
}

// Show mobile warning if on mobile device
function checkAndShowMobileWarning() {
  if (isMobileDevice()) {
    const mobileWarning = document.getElementById('mobile-warning');
    if (mobileWarning) {
      mobileWarning.classList.add('show');
      console.log('📱 Mobile device detected - showing performance warning');
    }
  } else {
    console.log('💻 Desktop device detected - no warning needed');
  }
}

// Check WebP and AVIF support on page load
checkWebPSupport();
checkAVIFSupport();

// Check for mobile device and show warning
checkAndShowMobileWarning();

let href = document.location.href;
href = href.indexOf('index.html') > -1 ? href.replace('index.html', '') : href;
const workerPath = href + 'k-means-clustering-worker.js?v=' + Date.now();
console.log('Worker path:', workerPath);
console.log('Current location:', document.location.href);
// as this runs from the dist directory, we want to generate multiple outputs
console.log('Creating WorkBoots with socksFile:', workerPath);
const workBoots = new WorkBoots({ socksFile: workerPath });
console.log('WorkBoots created:', workBoots);
console.log('WorkBoots properties:', Object.keys(workBoots));
console.log('WorkBoots ready method:', typeof workBoots.ready);
console.log('WorkBoots methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(workBoots)));

// Add direct message listener to see what the worker is sending
if (workBoots.worker) {
  console.log('Adding direct worker message listener...');
  workBoots.worker.addEventListener('message', (event) => {
    console.log('MAIN: Received worker message:', event.data);
  });
}

// get the image
// run k-means clustering on the hsl color values

// convert them to hex and display the:
//  * highest saturation?
//  * brightest?
//  * highest light values

/**
 *  todo:
 *   - MAKEOVER!!!!! pull in bootstrap material design, and maybe react
 *   ✅use background worker instead of locking up the page
 *   ✅parameterize the iteration count for k nearest neighbors
 *   - maybe support image scaling for faster, high iteration knn
        FOR SURE! however! i noticed some color desaturation from scaling in the mac os preview app,
        which is VERY suprising! OMG!?!?! WTFBBQ?!?!?
 *   - it seems like it doesn't find examples for each of the colors, which is odd?
        i think KMC is a decent choice, but not entirely what we want
        maybe, knn, or some hybrid approach, like instead of moving the centroids,
          could we pull the colors towards one another? idk, worth thought maybe?
 *   - drag and drop needs prevent default for files etc so the browser doesn't just load them
        yeah no clue, tried the body attributes, and prevent default on the event listener
        i haven't tried use whatever yet, but i forget
 *   ✅consider switching the current knn implementation for the clairvoyance impl,
 *       and providing progress updates using that callback from the background worker?
 */

const image = new Image();

function runUpload( file ) {
  // from https://codepen.io/markbet/pen/VoLqWd
  return new Promise((resolve, reject) => {
  	// http://stackoverflow.com/questions/12570834/how-to-preview-image-get-file-size-image-height-and-width-before-upload
  	// Supported formats: PNG, JPG, JPEG, GIF, BMP, WebP, AVIF
  	// WebP and AVIF provide excellent compression while maintaining quality
  	if( file.type === 'image/png'  ||
  			file.type === 'image/jpg'  ||
  		  file.type === 'image/jpeg' ||
  			file.type === 'image/gif'  ||
  			file.type === 'image/bmp'  ||
  			file.type === 'image/webp' ||
  			file.type === 'image/avif' ){
  		
  		console.log(`Processing ${file.type} file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  		
  		var reader = new FileReader(),
  				image = new Image();
  		reader.readAsDataURL( file );
  		reader.onload = function( _file ){
  			image.src = _file.target.result;
        image.onload = resolve.bind(null, image);
  		}
  		reader.onerror = function() {
  			reject(new Error(`Failed to read file: ${file.name}`));
  		}
  		
  		// Add timeout for large files
  		setTimeout(() => {
  			if (image.src === '') {
  				reject(new Error(`File loading timeout: ${file.name}`));
  			}
  		}, 30000); // 30 second timeout
  	} else {
  		reject(new Error(`Unsupported file type: ${file.type}. Supported formats: PNG, JPG, JPEG, GIF, BMP, WebP, AVIF`));
  	}
  });
}
//
// document.addEventListener('ondrop', (e) => {
//   e.preventDefault();
// });

// Drag and drop functionality
const dropzone = document.getElementById('dropzone');
const fileUpload = document.querySelector('.file-upload');
const loading = document.getElementById('loading');
const progressBar = document.getElementById('progress-bar');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, preventDefaults, false);
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropzone.classList.add('dragover');
}

function unhighlight(e) {
  dropzone.classList.remove('dragover');
}

// Handle dropped files
dropzone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > 0) {
    handleFiles(files);
  }
}

// Handle file selection
fileUpload.addEventListener('change', function() {
  if (this.files.length > 0) {
    handleFiles(this.files);
  }
});

// Click dropzone to trigger file input
dropzone.addEventListener('click', () => {
  fileUpload.click();
});

// Add event listener for the Run button
const runButton = document.getElementById('run-button');
runButton.addEventListener('click', processImage);

// Add event listener for the Export button
const exportButton = document.getElementById('export-button');
exportButton.addEventListener('click', exportPalette);

// Add double-click functionality to image container
const imageContainer = document.getElementById('image-container');
imageContainer.addEventListener('dblclick', handleImageDoubleClick);

// Global variables to store current image data
let currentImageData = null;
let currentImageWidth = null;
let currentImageHeight = null;
let currentPalette = []; // Store current palette colors
let canvas = null;
let ctx = null;

function processImage() {
  if (!currentImageData) {
    alert('Please upload an image first.');
    return;
  }

    // Show loading state
  loading.classList.add('show');
  progressBar.style.width = '0%';
  
  // Clear status
  const statusElement = document.getElementById('processing-status');
  if (statusElement) {
    statusElement.textContent = 'Initializing...';
  }
  
  // Clear previous results
  document.querySelector('svg')?.remove();
  document.querySelector('.pallet').innerHTML = '';

  console.log('Trying direct WorkBoots usage without ready()...');
  console.log('workBoots object:', workBoots);
  console.log('workBoots.ready:', workBoots.ready);
  
  // Try direct usage without waiting for ready
  try {
    workBoots.onMessage(({ data }) => {
      if ('graphNodes' in data) {
        const { graphNodes } = data;
        const pallet = document.getElementById('pallet');
        
        // Create color palette
        graphNodes.forEach((centroid, index) => {
          const div = document.createElement("div");
          div.style.backgroundColor = centroid.color;
          div.title = centroid.color;
          
          // Add click to copy functionality
          div.addEventListener('click', () => {
            navigator.clipboard.writeText(centroid.color).then(() => {
              div.style.transform = 'scale(1.1)';
              setTimeout(() => {
                div.style.transform = '';
              }, 200);
            });
          });

          pallet.appendChild(div);
          
          // Add to main palette for display
          const color = tinycolor(centroid.color);
          const hsv = color.toHsv();
          const rgb = color.toRgb();
          
          mainPalette.push({
            hex: centroid.color,
            rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
            hsv: { h: hsv.h, s: hsv.s, v: hsv.v },
            x: centroid.x,
            y: centroid.y,
            source: 'auto-generated'
          });
        });
        
        // Initialize working palette with main palette for editing
        workingPalette = [...mainPalette];
        currentPalette = [...mainPalette]; // Keep for backward compatibility
        
        // Store original palette for reset functionality
        originalPalette = [...mainPalette];

        const graph = createGraph(graphNodes);
        const { svg, simulation, scaleColorNode, resetColorNode } = generateChart(currentImageWidth, currentImageHeight, graph);
        document.getElementById('image-container').appendChild(svg);
        
        // Add hover effects to palette colors
        const paletteColors = pallet.querySelectorAll('div');
        paletteColors.forEach((div, index) => {
          // Add hover listeners to scale corresponding D3 circles
          div.addEventListener('mouseenter', () => {
            scaleColorNode(index, 1.5);
          });
          
          div.addEventListener('mouseleave', () => {
            resetColorNode(index);
          });
        });
        
        // Hide loading
        loading.classList.remove('show');
        
        // Show palette management section
        showPaletteManagement();
        
        // RobotCopy and state machine temporarily disabled for testing
        // try {
        //   robotCopy.sendMessage('PALETTE_GENERATED', {
        //     paletteSize: currentPalette.length,
        //     colors: currentPalette.map(c => c.hex)
        //   });
        // } catch (error) {
        //   console.log('RobotCopy message skipped:', error.message);
        // }
        
        // try {
        //   paletteStateMachine.send('PALETTE_GENERATED');
        // } catch (error) {
        //   console.log('State machine update skipped:', error.message);
        // }
               } else if ('progressUpdate' in data) {
           const { progressUpdate, status } = data;
           // Update progress bar
           if (progressUpdate && typeof progressUpdate === 'number') {
             progressBar.style.width = `${progressUpdate}%`;
           }
           // Update status message if provided
           if (status) {
             const statusElement = document.getElementById('processing-status');
             if (statusElement) {
               statusElement.textContent = status;
             }
           }
         }
    });

    let iterations = Number(document.querySelector('.iteration-count').value);
    iterations = (isNaN(iterations) || +iterations === 0) ? 4 : iterations;
    let palletSize = Number(document.querySelector('.pallet-size').value);
    palletSize = (isNaN(palletSize) || +palletSize === 0) ? 20 : palletSize;
    let hsvTolerance = Number(document.querySelector('.hsv-tolerance').value);
    hsvTolerance = (isNaN(hsvTolerance) || +hsvTolerance === 0) ? 30 : hsvTolerance;
    let toleranceEnabled = document.querySelector('.tolerance-enabled').checked;
    let distanceMethod = document.querySelector('input[name="distance-method"]:checked').value;

    workBoots.postMessage({
      imageData: currentImageData,
      iterations,
      palletSize,
      width: currentImageWidth,
      height: currentImageHeight,
      hsvTolerance,
      toleranceEnabled,
      distanceMethod
    });
  } catch (error) {
    console.error('Error with direct WorkBoots usage:', error);
    loading.classList.remove('show');
    alert('Error processing image. Please try again.');
  }
}

function handleImageDoubleClick(event) {
  if (!currentImageData || !canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Check if click is within canvas bounds
  if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
  
  // Convert screen coordinates to canvas coordinates
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const canvasX = Math.floor(x * scaleX);
  const canvasY = Math.floor(y * scaleY);
  
  // Ensure coordinates are within canvas bounds
  if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) return;
  
  // Get the pixel color at the clicked position
  const pixelIndex = (canvasY * canvas.width + canvasX) * 4;
  const r = currentImageData[pixelIndex];
  const g = currentImageData[pixelIndex + 1];
  const b = currentImageData[pixelIndex + 2];
  const a = currentImageData[pixelIndex + 3];
  
  // Convert to hex and add to palette
  const color = tinycolor({ r, g, b, a });
  const hexColor = color.toHexString();
  const hsv = color.toHsv();
  
  // Add to current palette
  const newColor = {
    hex: hexColor,
    rgb: { r, g, b },
    hsv: { h: hsv.h, s: hsv.s, v: hsv.v },
    x: canvasX,
    y: canvasY,
    source: 'manual-selection'
  };
  
  currentPalette.push(newColor);
  addColorToPalette(newColor);
  
  // Show palette management if not already visible
  if (document.getElementById('palette-management').style.display === 'none') {
    showPaletteManagement();
  }
  
  // Update palette management display
  updateActivePaletteDisplay();
  
          // RobotCopy temporarily disabled for testing
          // try {
          //   robotCopy.sendMessage('COLOR_ADDED', {
          //     color: hexColor,
          //     source: 'manual-selection',
          //     coordinates: { x: canvasX, y: canvasY }
          //   });
          // } catch (error) {
          //   console.log('RobotCopy message skipped:', error.message);
          // }
  
  // Add a visual indicator at the clicked point
  addClickIndicator(canvasX, canvasY);
}

function addColorToPalette(color) {
  const pallet = document.getElementById('pallet');
  const div = document.createElement("div");
  div.style.backgroundColor = color.hex;
  div.title = `${color.hex}\nRGB: (${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\nHSV: (${Math.round(color.hsv.h)}°, ${Math.round(color.hsv.s * 100)}%, ${Math.round(color.hsv.v * 100)}%)`;
  
  // Add click to copy functionality
  div.addEventListener('click', () => {
    navigator.clipboard.writeText(color.hex).then(() => {
      div.style.transform = 'scale(1.1)';
      setTimeout(() => {
        div.style.transform = '';
      }, 200);
    });
  });

  pallet.appendChild(div);
}

function addClickIndicator(x, y) {
  // Create a temporary indicator at the clicked point
  const indicator = document.createElement('div');
  indicator.style.position = 'absolute';
  indicator.style.left = `${(x / canvas.width) * 100}%`;
  indicator.style.top = `${(y / canvas.height) * 100}%`;
  indicator.style.width = '10px';
  indicator.style.height = '10px';
  indicator.style.backgroundColor = 'red';
  indicator.style.border = '2px solid white';
  indicator.style.borderRadius = '50%';
  indicator.style.transform = 'translate(-50%, -50%)';
  indicator.style.zIndex = '1002';
  indicator.style.pointerEvents = 'none';
  
  imageContainer.appendChild(indicator);
  
  // Remove indicator after 2 seconds
  setTimeout(() => {
    indicator.remove();
  }, 2000);
}

function exportPalette() {
  if (currentPalette.length === 0) {
    alert('No colors in palette to export.');
    return;
  }
  
  // Disable button during export
  exportButton.disabled = true;
  exportButton.textContent = 'Exporting...';
  
  const exportData = {
    palette: currentPalette,
    exportDate: new Date().toISOString(),
    imageDimensions: {
      width: currentImageWidth,
      height: currentImageHeight
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `color-palette-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  
  // Re-enable button after export
  setTimeout(() => {
    exportButton.disabled = false;
    exportButton.textContent = 'Export Palette';
  }, 1000);
  
  // RobotCopy temporarily disabled for testing
  // try {
  //   robotCopy.sendMessage('PALETTE_EXPORTED', {
  //     paletteSize: currentPalette.length,
  //     exportDate: new Date().toISOString()
  //   });
  // } catch (error) {
  //   console.log('RobotCopy message skipped:', error.message);
  // }
}

function handleFiles(files) {
  if (files.length === 0) return;
  
  const file = files[0];
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  // Show loading state
  loading.classList.add('show');
  progressBar.style.width = '0%';

  runUpload(file).then(image => {
    // Clear previous results
    document.querySelector('svg')?.remove();
    document.querySelector('.pallet').innerHTML = '';
    currentPalette = []; // Reset palette
    
    const width = image.width;
    const height = image.height;

    canvas = document.querySelector('canvas');
    ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);

    // Store image data for re-processing
    currentImageData = imageData.data;
    currentImageWidth = width;
    currentImageHeight = height;
    
    // Add class to indicate image is loaded
    imageContainer.classList.add('has-image');

    // Process the image
    processImage();
  }).catch(error => {
    console.error('Error loading image:', error);
    loading.classList.remove('show');
    alert('Error loading image. Please try again.');
  });
}

// Palette Management Functions
function showPaletteManagement() {
  const paletteManagement = document.getElementById('palette-management');
  paletteManagement.style.display = 'block';
  updateActivePaletteDisplay();
  updateSavedPalettesList();
}

function updateActivePaletteDisplay() {
  const activePaletteColors = document.getElementById('active-palette-colors');
  activePaletteColors.innerHTML = '';
  
  workingPalette.forEach((color, index) => {
    const colorItem = document.createElement('div');
    colorItem.className = 'palette-color-item';
    colorItem.style.backgroundColor = color.hex;
    colorItem.title = `${color.hex}\nRGB: (${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\nHSV: (${Math.round(color.hsv.h)}°, ${Math.round(color.hsv.s * 100)}%, ${Math.round(color.hsv.v * 100)}%)`;
    
    // Add click to select functionality
    colorItem.addEventListener('click', () => {
      if (selectedColors.includes(index)) {
        selectedColors = selectedColors.filter(i => i !== index);
        colorItem.classList.remove('selected');
      } else {
        selectedColors.push(index);
        colorItem.classList.add('selected');
      }
    });
    
    // Add remove button
    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove-color';
    removeBtn.innerHTML = '×';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeColorFromPalette(index);
    });
    
    colorItem.appendChild(removeBtn);
    activePaletteColors.appendChild(colorItem);
  });
}

function removeColorFromPalette(index) {
  workingPalette.splice(index, 1);
  selectedColors = selectedColors.filter(i => i !== index);
  // Adjust indices for remaining selected colors
  selectedColors = selectedColors.map(i => i > index ? i - 1 : i);
  updateActivePaletteDisplay();
  // Don't update main palette display - keep it separate
}

function updatePaletteDisplay() {
  const pallet = document.getElementById('pallet');
  console.log('updatePaletteDisplay called with', mainPalette.length, 'colors');
  console.log('Main palette colors:', mainPalette.map(c => c.hex));
  
  pallet.innerHTML = '';
  
  mainPalette.forEach((color, index) => {
    const div = document.createElement("div");
    div.style.backgroundColor = color.hex;
    div.title = `${color.hex}\nRGB: (${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\nHSV: (${Math.round(color.hsv.h)}°, ${Math.round(color.hsv.s * 100)}%, ${Math.round(color.hsv.v * 100)}%)`;
    
    // Add click to copy functionality
    div.addEventListener('click', () => {
      navigator.clipboard.writeText(color.hex).then(() => {
        div.style.transform = 'scale(1.1)';
        setTimeout(() => {
          div.style.transform = '';
        }, 200);
      });
    });

    pallet.appendChild(div);
  });
  
  console.log('Main palette display updated with', pallet.children.length, 'color divs');
}

function updateSavedPalettesList() {
  const savedPalettesList = document.getElementById('saved-palettes-list');
  savedPalettesList.innerHTML = '';
  
  savedPalettes.forEach((palette, index) => {
    const paletteItem = document.createElement('div');
    paletteItem.className = 'saved-palette-item';
    paletteItem.title = `Created: ${new Date(palette.timestamp).toLocaleString()}`;
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.className = 'saved-palette-item-text';
    textSpan.textContent = `Palette ${index + 1} (${palette.colors.length} colors)`;
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-palette-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete this palette';
    
    // Delete button click handler
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering the palette load
      deleteSavedPalette(index);
    });
    
    // Text span click handler (load palette)
    textSpan.addEventListener('click', () => {
      loadSavedPalette(index);
    });
    
    paletteItem.appendChild(textSpan);
    paletteItem.appendChild(deleteBtn);
    savedPalettesList.appendChild(paletteItem);
  });
}

function deleteSavedPalette(index) {
  if (index >= 0 && index < savedPalettes.length) {
    const palette = savedPalettes[index];
    if (confirm(`Delete Palette ${index + 1} (${palette.colors.length} colors)?\n\nThis action cannot be undone.`)) {
      // Use business logic layer
      paletteManager.deleteSavedPalette(index);
      
      // Update local reference
      savedPalettes = paletteManager.loadSavedPalettes();
      updateSavedPalettesList();
      
      // Show success message through UI controller if available
      if (uiController) {
        uiController.showSuccess('🗑️ Palette deleted!');
      } else {
        const copyStatus = document.getElementById('copy-status');
        if (copyStatus) {
          copyStatus.textContent = '🗑️ Palette deleted!';
          setTimeout(() => {
            copyStatus.textContent = '';
          }, 2000);
        }
      }
      
      console.log('Palette deleted:', index);
    }
  }
}

function saveCurrentPalette() {
  if (currentPalette.length === 0) {
    alert('No colors in palette to save.');
    return;
  }
  
  const paletteData = {
    colors: [...currentPalette],
    timestamp: new Date().toISOString(),
    name: `Palette ${savedPalettes.length + 1}`
  };
  
  savedPalettes.push(paletteData);
  localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
  updateSavedPalettesList();
  
  // Show success message
  const copyStatus = document.getElementById('copy-status');
  copyStatus.textContent = '✅ Palette saved!';
  setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
  
  // RobotCopy temporarily disabled for testing
  // try {
  //   robotCopy.sendMessage('PALETTE_SAVED', {
  //     paletteSize: currentPalette.length,
  //     saveDate: new Date().toISOString()
  //   });
  // } catch (error) {
  //   console.log('RobotCopy message skipped:', error.message);
  // }
}

function loadSavedPalette(index) {
  if (index >= 0 && index < savedPalettes.length) {
    currentPalette = [...savedPalettes[index].colors];
    updateActivePaletteDisplay();
    updatePaletteDisplay();
    
    // Show success message
    const copyStatus = document.getElementById('copy-status');
    copyStatus.textContent = '✅ Palette loaded!';
    setTimeout(() => {
      copyStatus.textContent = '';
    }, 2000);
    
    // RobotCopy temporarily disabled for testing
    // try {
    //   robotCopy.sendMessage('PALETTE_LOADED', {
    //     paletteIndex: index,
    //     paletteSize: currentPalette.length,
    //     loadDate: new Date().toISOString()
    //   });
    // } catch (error) {
    //   console.log('RobotCopy message skipped:', error.message);
    // }
  }
}

function resetPalette() {
  if (confirm('Are you sure you want to reset the working palette to the original generated palette?')) {
    if (mainPalette.length > 0) {
      // Reset working palette to match main palette
      workingPalette = [...mainPalette];
      currentPalette = [...mainPalette]; // Keep for backward compatibility
      selectedColors = [];
      updateActivePaletteDisplay();
      // Don't update main palette display - it should stay the same
      
      // Show success message
      const copyStatus = document.getElementById('copy-status');
      copyStatus.textContent = '✅ Palette reset!';
      setTimeout(() => {
        copyStatus.textContent = '';
      }, 2000);
      
      // RobotCopy temporarily disabled for testing
      // try {
      //   robotCopy.sendMessage('PALETTE_RESET', {
      //     originalSize: mainPalette.length
      //   });
      // } catch (error) {
      //   console.log('RobotCopy message skipped:', error.message);
      // }
    } else {
      alert('No original palette to reset to. Please run the analysis first.');
    }
  }
}

function clearPalette() {
  if (confirm('Are you sure you want to clear all colors from the working palette?')) {
    const clearedCount = workingPalette.length;
    workingPalette = [];
    currentPalette = []; // Keep for backward compatibility
    selectedColors = [];
    updateActivePaletteDisplay();
    // Don't update main palette display - keep it separate
    
    // Show success message
    const copyStatus = document.getElementById('copy-status');
    copyStatus.textContent = '✅ Palette cleared!';
    setTimeout(() => {
      copyStatus.textContent = '';
    }, 2000);
    
    // RobotCopy temporarily disabled for testing
    // try {
    //   robotCopy.sendMessage('PALETTE_CLEARED', {
    //     clearedCount: clearedCount
    //   });
    // } catch (error) {
    //   console.log('RobotCopy message skipped:', error.message);
    // }
  }
}

function duplicatePalette() {
  if (workingPalette.length === 0) {
    alert('No colors in the palette to duplicate.');
    return;
  }
  
  if (confirm(`This will duplicate all ${workingPalette.length} colors in the palette. Continue?`)) {
    // Create a deep copy of all colors in the working palette
    const duplicatedColors = workingPalette.map(color => ({
      hex: color.hex,
      rgb: { ...color.rgb },
      hsv: { ...color.hsv },
      source: `${color.source}-duplicate`
    }));
    
    // Add the duplicated colors to the working palette
    workingPalette = [...workingPalette, ...duplicatedColors];
    currentPalette = [...workingPalette]; // Keep for backward compatibility
    selectedColors = []; // Clear selection
    updateActivePaletteDisplay();
    
    // Show success message
    const copyStatus = document.getElementById('copy-status');
    copyStatus.textContent = `✅ Palette duplicated! Added ${duplicatedColors.length} colors.`;
    setTimeout(() => {
      copyStatus.textContent = '';
    }, 2000);
    
    console.log('Palette duplicated:', duplicatedColors.length, 'colors added');
  }
}

// Color Theory Functions
function generateSplitComplements() {
  if (selectedColors.length === 0) {
    alert('Please select a color first.');
    return;
  }
  
  // Validate that the selected color index exists in the working palette
  if (!workingPalette[selectedColors[0]]) {
    alert('Selected color is no longer valid. Please select a color from the current palette.');
    selectedColors = [];
    return;
  }
  
  const baseColor = workingPalette[selectedColors[0]];
  const baseHue = baseColor.hsv.h;
  
  // Split complements are 150° and 210° from the base color
  const split1 = tinycolor({ h: (baseHue + 150) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  const split2 = tinycolor({ h: (baseHue + 210) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  
  const newColors = [
    {
      hex: baseColor.hex,
      rgb: baseColor.rgb,
      hsv: baseColor.hsv,
      source: 'base-color'
    },
    {
      hex: split1.toHexString(),
      rgb: split1.toRgb(),
      hsv: split1.toHsv(),
      source: 'split-complement-1'
    },
    {
      hex: split2.toHexString(),
      rgb: split2.toRgb(),
      hsv: split2.toHsv(),
      source: 'split-complement-2'
    }
  ];
  
  console.log('Adding split complements to palette:', newColors.slice(1).map(c => c.hex));
  
  // Add the new complementary colors to the existing working palette (skip base color at index 0)
  workingPalette = [...workingPalette, ...newColors.slice(1)];
  
  console.log('Updated working palette:', workingPalette.map(c => c.hex));
  
  selectedColors = []; // Clear selection
  
  // Update working palette display only
  updateActivePaletteDisplay();
  // Don't update main palette display - keep it separate
  
  // Show success message
  const copyStatus = document.getElementById('copy-status');
  copyStatus.textContent = '✅ Split complements added!';
  setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
  
  // RobotCopy temporarily disabled for testing
  // try {
  //   robotCopy.sendMessage('SPLIT_COMPLEMENTS_GENERATED', {
  //     baseColor: baseColor.hex,
  //     newColors: newColors.map(c => c.hex)
  //   });
  // } catch (error) {
  //   console.log('RobotCopy message skipped:', error.message);
  // }
}

function generateComponentTriads() {
  if (selectedColors.length === 0) {
    alert('Please select a color first.');
    return;
  }
  
  // Validate that the selected color index exists in the working palette
  if (!workingPalette[selectedColors[0]]) {
    alert('Selected color is no longer valid. Please select a color from the current palette.');
    selectedColors = [];
    return;
  }
  
  const baseColor = workingPalette[selectedColors[0]];
  const baseHue = baseColor.hsv.h;
  
  // Triads are 120° apart
  const triad1 = tinycolor({ h: (baseHue + 120) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  const triad2 = tinycolor({ h: (baseHue + 240) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  
  const newColors = [
    {
      hex: baseColor.hex,
      rgb: baseColor.rgb,
      hsv: baseColor.hsv,
      source: 'base-color'
    },
    {
      hex: triad1.toHexString(),
      rgb: triad1.toRgb(),
      hsv: triad1.toHsv(),
      source: 'component-triad-1'
    },
    {
      hex: triad2.toHexString(),
      rgb: triad2.toRgb(),
      hsv: triad2.toHsv(),
      source: 'component-triad-2'
    }
  ];
  
  console.log('Adding component triads to palette:', newColors.slice(1).map(c => c.hex));
  
  // Add the new triad colors to the existing working palette (skip base color at index 0)
  workingPalette = [...workingPalette, ...newColors.slice(1)];
  selectedColors = []; // Clear selection
  
  // Update working palette display only
  updateActivePaletteDisplay();
  // Don't update main palette display - keep it separate
  
  // Show success message
  const copyStatus = document.getElementById('copy-status');
  copyStatus.textContent = '✅ Component triads added!';
  setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
  
  // RobotCopy temporarily disabled for testing
  // try {
  //   robotCopy.sendMessage('COMPONENT_TRIADS_GENERATED', {
  //     baseColor: baseColor.hex,
  //     newColors: newColors.map(c => c.hex)
  //   });
  // } catch (error) {
  //   console.log('RobotCopy message skipped:', error.message);
  // }
}

function generateComponentQuads() {
  if (selectedColors.length === 0) {
    alert('Please select a color first.');
    return;
  }
  
  // Validate that the selected color index exists in the working palette
  if (!workingPalette[selectedColors[0]]) {
    alert('Selected color is no longer valid. Please select a color from the current palette.');
    selectedColors = [];
    return;
  }
  
  const baseColor = workingPalette[selectedColors[0]];
  const baseHue = baseColor.hsv.h;
  
  // Quads are 90° apart
  const quad1 = tinycolor({ h: (baseHue + 90) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  const quad2 = tinycolor({ h: (baseHue + 180) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  const quad3 = tinycolor({ h: (baseHue + 270) % 360, s: baseColor.hsv.s, v: baseColor.hsv.v });
  
  const newColors = [
    {
      hex: baseColor.hex,
      rgb: baseColor.rgb,
      hsv: baseColor.hsv,
      source: 'base-color'
    },
    {
      hex: quad1.toHexString(),
      rgb: quad1.toRgb(),
      hsv: quad1.toHsv(),
      source: 'component-quad-1'
    },
    {
      hex: quad2.toHexString(),
      rgb: quad2.toRgb(),
      hsv: quad2.toHsv(),
      source: 'component-quad-2'
    },
    {
      hex: quad3.toHexString(),
      rgb: quad3.toRgb(),
      hsv: quad3.toHsv(),
      source: 'component-quad-3'
    }
  ];
  
  console.log('Adding component quads to palette:', newColors.slice(1).map(c => c.hex));
  
  // Add the new quad colors to the existing working palette (skip base color at index 0)
  workingPalette = [...workingPalette, ...newColors.slice(1)];
  selectedColors = []; // Clear selection
  
  // Update working palette display only
  updateActivePaletteDisplay();
  // Don't update main palette display - keep it separate
  
  // Show success message
  const copyStatus = document.getElementById('copy-status');
  copyStatus.textContent = '✅ Component quads added!';
  setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
  
  // RobotCopy temporarily disabled for testing
  // try {
  //   robotCopy.sendMessage('COMPONENT_QUADS_GENERATED', {
  //     baseColor: baseColor.hex,
  //     newColors: newColors.map(c => c.hex)
  //   });
  // } catch (error) {
  //   console.log('RobotCopy message skipped:', error.message);
  // }
}

// Color Picker Modal Functions
function showColorPicker() {
  const modal = document.getElementById('color-picker-modal');
  modal.style.display = 'flex';
  
  // Initialize color picker with current values
  const hexInput = document.getElementById('hex-color-input');
  const redSlider = document.getElementById('red-slider');
  const greenSlider = document.getElementById('green-slider');
  const blueSlider = document.getElementById('blue-slider');
  
  hexInput.value = '#ff0000';
  redSlider.value = 255;
  greenSlider.value = 0;
  blueSlider.value = 0;
  
  updateColorPreview();
}

function hideColorPicker() {
  const modal = document.getElementById('color-picker-modal');
  modal.style.display = 'none';
}

function updateColorPreview() {
  const hexInput = document.getElementById('hex-color-input');
  const redSlider = document.getElementById('red-slider');
  const greenSlider = document.getElementById('green-slider');
  const blueSlider = document.getElementById('blue-slider');
  const colorPreview = document.getElementById('color-preview');
  
  let hexColor = hexInput.value;
  if (hexColor.match(/^#[0-9A-Fa-f]{6}$/)) {
    const color = tinycolor(hexColor);
    redSlider.value = color.toRgb().r;
    greenSlider.value = color.toRgb().g;
    blueSlider.value = color.toRgb().b;
  } else {
    const r = parseInt(redSlider.value);
    const g = parseInt(greenSlider.value);
    const b = parseInt(blueSlider.value);
    hexColor = tinycolor({ r, g, b }).toHexString();
    hexInput.value = hexColor;
  }
  
  colorPreview.style.backgroundColor = hexColor;
  colorPreview.className = 'color-preview valid';
  colorPreview.innerHTML = `<div class="color-preview-text">${hexColor.toUpperCase()}</div>`;
  
  // Update slider value displays
  document.getElementById('red-value').textContent = redSlider.value;
  document.getElementById('green-value').textContent = greenSlider.value;
  document.getElementById('blue-value').textContent = blueSlider.value;
}

function addCustomColor() {
  const hexInput = document.getElementById('hex-color-input');
  const hexColor = hexInput.value;
  
  if (!hexColor.match(/^#[0-9A-Fa-f]{6}$/)) {
    alert('Please enter a valid hex color (e.g., #ff0000)');
    return;
  }
  
  const color = tinycolor(hexColor);
  const newColor = {
    hex: hexColor,
    rgb: color.toRgb(),
    hsv: color.toHsv(),
    source: 'custom-color'
  };
  
  console.log('Adding custom color to working palette:', hexColor);
  console.log('Working palette before:', workingPalette.length, 'colors');
  
  // Add to working palette (the editable one)
  workingPalette.push(newColor);
  
  console.log('Working palette after:', workingPalette.length, 'colors');
  console.log('Working palette colors:', workingPalette.map(c => c.hex));
  
  // Update displays
  updateActivePaletteDisplay();
  // Don't update main palette display - keep it separate
  
  hideColorPicker();
  
  // Show success message
  const copyStatus = document.getElementById('copy-status');
  copyStatus.textContent = '✅ Custom color added!';
  setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
  
  // RobotCopy temporarily disabled for testing
  // try {
  //   robotCopy.sendMessage('CUSTOM_COLOR_ADDED', {
  //     color: hexColor,
  //     source: 'custom-color-picker'
  //   });
  // } catch (error) {
  //   console.log('RobotCopy message skipped:', error.message);
  // }
}

// Test Functions for Debugging
function createTestPalette() {
  console.log('=== Creating Test Palette ===');
  
  // Create a simple test palette with 3 colors
  const testColors = [
    { hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 }, hsv: { h: 0, s: 1, v: 1 }, source: 'test-red' },
    { hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 }, hsv: { h: 120, s: 1, v: 1 }, source: 'test-green' },
    { hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 }, hsv: { h: 240, s: 1, v: 1 }, source: 'test-blue' }
  ];
  
  console.log('Test colors:', testColors.map(c => c.hex));
  
  // Set main palette (displayed below image)
  mainPalette = [...testColors];
  
  // Set working palette (for experiments)
  workingPalette = [...testColors];
  
  // Keep currentPalette for backward compatibility
  currentPalette = [...testColors];
  
  // Clear selected colors to prevent stale indices
  selectedColors = [];
  
  console.log('Main palette:', mainPalette.map(c => c.hex));
  console.log('Working palette:', workingPalette.map(c => c.hex));
  
  // Update displays
  updateActivePaletteDisplay();
  updatePaletteDisplay();
  
  // Show success message
  const copyStatus = document.getElementById('copy-status');
  copyStatus.textContent = '🧪 Test palette created!';
  setTimeout(() => {
    copyStatus.textContent = '';
  }, 2000);
}


// Coffee Accordion Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI Controller with business logic
  uiController = new UIController(paletteManager);
  console.log('UI Controller initialized');
  
  // Initialize palette management event listeners
  initializePaletteManagement();
  
  const coffeeAccordionButton = document.getElementById('coffee-accordion-button');
  const coffeeAccordionContent = document.getElementById('coffee-accordion-content');
  
  if (coffeeAccordionButton && coffeeAccordionContent) {
    coffeeAccordionButton.addEventListener('click', function() {
      const isCollapsed = coffeeAccordionButton.classList.contains('collapsed');
      
      if (isCollapsed) {
        // Expand accordion
        coffeeAccordionButton.classList.remove('collapsed');
        coffeeAccordionContent.classList.add('expanded');
      } else {
        // Collapse accordion
        coffeeAccordionButton.classList.add('collapsed');
        coffeeAccordionContent.classList.remove('expanded');
      }
    });
    
    // Start with collapsed state
    coffeeAccordionButton.classList.add('collapsed');
  }

  // Copy ETH Address Functionality
  const copyAddressBtn = document.getElementById('copy-address-btn');
  if (copyAddressBtn) {
    copyAddressBtn.addEventListener('click', async function() {
      const ethAddress = '0x30c599E83Afc27Fc7b2bCdaF400E5c15a31C6148';
      
      try {
        await navigator.clipboard.writeText(ethAddress);
        
        // Visual feedback
        const originalText = copyAddressBtn.textContent;
        copyAddressBtn.textContent = '✅';
        copyAddressBtn.style.background = '#28a745';
        
        // Reset after 2 seconds
        setTimeout(() => {
          copyAddressBtn.textContent = originalText;
          copyAddressBtn.style.background = '#6c757d';
        }, 2000);
        
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = ethAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Visual feedback
        const originalText = copyAddressBtn.textContent;
        copyAddressBtn.textContent = '✅';
        copyAddressBtn.style.background = '#28a745';
        
        // Reset after 2 seconds
        setTimeout(() => {
          copyAddressBtn.textContent = originalText;
          copyAddressBtn.style.background = '#6c757d';
        }, 2000);
      }
    });

    // Copy BTC Address Functionality
    const copyBtcAddressBtn = document.getElementById('copy-btc-address-btn');
    if (copyBtcAddressBtn) {
      copyBtcAddressBtn.addEventListener('click', async function() {
        const btcAddress = '12eL89fh5t5E5hKDfVyypKB6Yzg9JNQDk6';
        
        try {
          await navigator.clipboard.writeText(btcAddress);
          
          // Visual feedback
          const originalText = copyBtcAddressBtn.textContent;
          copyBtcAddressBtn.textContent = '✅';
          copyBtcAddressBtn.style.background = '#28a745';
          
          // Reset after 2 seconds
          setTimeout(() => {
            copyBtcAddressBtn.textContent = originalText;
            copyBtcAddressBtn.style.background = '#6c757d';
          }, 2000);
          
        } catch (err) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = btcAddress;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          // Visual feedback
          const originalText = copyBtcAddressBtn.textContent;
          copyBtcAddressBtn.textContent = '✅';
          copyBtcAddressBtn.style.background = '#28a745';
          
          // Reset after 2 seconds
          setTimeout(() => {
            copyBtcAddressBtn.textContent = originalText;
            copyBtcAddressBtn.style.background = '#6c757d';
          }, 2000);
        }
      });
    }
  }
});

// Initialize Palette Management Event Listeners
function initializePaletteManagement() {
  // Copy palette button
  const copyPaletteBtn = document.getElementById('copy-palette-btn');
  if (copyPaletteBtn) {
    copyPaletteBtn.addEventListener('click', saveCurrentPalette);
  }
  
  // Palette control buttons
  const addCustomColorBtn = document.getElementById('add-custom-color-btn');
  if (addCustomColorBtn) {
    addCustomColorBtn.addEventListener('click', showColorPicker);
  }
  
  const resetPaletteBtn = document.getElementById('reset-palette-btn');
  if (resetPaletteBtn) {
    resetPaletteBtn.addEventListener('click', resetPalette);
  }
  
  const clearPaletteBtn = document.getElementById('clear-palette-btn');
  if (clearPaletteBtn) {
    clearPaletteBtn.addEventListener('click', clearPalette);
  }
  
  const duplicatePaletteBtn = document.getElementById('duplicate-palette-btn');
  if (duplicatePaletteBtn) {
    duplicatePaletteBtn.addEventListener('click', duplicatePalette);
  }
  
  // Color theory buttons
  const splitComplementsBtn = document.getElementById('split-complements-btn');
  if (splitComplementsBtn) {
    splitComplementsBtn.addEventListener('click', generateSplitComplements);
  }
  
  const componentTriadsBtn = document.getElementById('component-triads-btn');
  if (componentTriadsBtn) {
    componentTriadsBtn.addEventListener('click', generateComponentTriads);
  }
  
  const componentQuadsBtn = document.getElementById('component-quads-btn');
  if (componentQuadsBtn) {
    componentQuadsBtn.addEventListener('click', generateComponentQuads);
  }
  
  // Color picker modal event listeners
  const closeColorPickerBtn = document.getElementById('close-color-picker');
  if (closeColorPickerBtn) {
    closeColorPickerBtn.addEventListener('click', hideColorPicker);
  }
  
  const cancelColorBtn = document.getElementById('cancel-color-btn');
  if (cancelColorBtn) {
    cancelColorBtn.addEventListener('click', hideColorPicker);
  }
  
  const addColorBtn = document.getElementById('add-color-btn');
  if (addColorBtn) {
    addColorBtn.addEventListener('click', addCustomColor);
  }
  
  // Color picker input event listeners
  const hexInput = document.getElementById('hex-color-input');
  if (hexInput) {
    hexInput.addEventListener('input', updateColorPreview);
  }
  
  const redSlider = document.getElementById('red-slider');
  if (redSlider) {
    redSlider.addEventListener('input', updateColorPreview);
  }
  
  const greenSlider = document.getElementById('green-slider');
  if (greenSlider) {
    greenSlider.addEventListener('input', updateColorPreview);
  }
  
  const blueSlider = document.getElementById('blue-slider');
  if (blueSlider) {
    blueSlider.addEventListener('input', updateColorPreview);
  }
  
  // Close modal when clicking outside
  const colorPickerModal = document.getElementById('color-picker-modal');
  if (colorPickerModal) {
    colorPickerModal.addEventListener('click', (e) => {
      if (e.target === colorPickerModal) {
        hideColorPicker();
      }
    });
  }
  
  // Test button event listeners
  const createTestPaletteBtn = document.getElementById('create-test-palette-btn');
  if (createTestPaletteBtn) {
    createTestPaletteBtn.addEventListener('click', createTestPalette);
  }
}
