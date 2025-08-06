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
    
    const width = image.width;
    const height = image.height;

    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);

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
          });

          const graph = createGraph(graphNodes);
          const { svg, simulation, scaleColorNode, resetColorNode } = generateChart(width, height, graph);
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

      workBoots.postMessage({
        imageData: imageData.data,
        iterations,
        palletSize,
        width,
        height
      });
    } catch (error) {
      console.error('Error with direct WorkBoots usage:', error);
      loading.classList.remove('show');
      alert('Error processing image. Please try again.');
    }
  }).catch(error => {
    console.error('Error loading image:', error);
    loading.classList.remove('show');
    alert('Error loading image. Please try again.');
  });
}
