import d3_force from 'd3-force';
import d3 from 'd3';
import tinycolor from 'tinycolor2';
import clusters from 'clusters';
import { createGraph, generateChart } from './chart.js';
const workbootsExports = require('workboots');
console.log('Constructor found! Using window.WorkBoots.WorkBoots');
const WorkBoots = window.WorkBoots.WorkBoots;

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
  	if( file.type === 'image/png'  ||
  			file.type === 'image/jpg'  ||
  		  file.type === 'image/jpeg' ||
  			file.type === 'image/gif'  ||
  			file.type === 'image/bmp'  ){
  		var reader = new FileReader(),
  				image = new Image();
  		reader.readAsDataURL( file );
  		reader.onload = function( _file ){
  			image.src = _file.target.result;
        image.onload = resolve.bind(null, image);
  		}
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
          
          // Add to current palette for export
          const color = tinycolor(centroid.color);
          const hsv = color.toHsv();
          const rgb = color.toRgb();
          
          currentPalette.push({
            hex: centroid.color,
            rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
            hsv: { h: hsv.h, s: hsv.s, v: hsv.v },
            x: centroid.x,
            y: centroid.y,
            source: 'auto-generated'
          });
        });

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
      } else if ('progressUpdate' in data) {
        const { progressUpdate } = data;
        // Update progress bar
        if (progressUpdate && typeof progressUpdate === 'number') {
          progressBar.style.width = `${progressUpdate}%`;
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

// Coffee Accordion Functionality
document.addEventListener('DOMContentLoaded', function() {
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
