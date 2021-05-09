import d3_force from 'd3-force';
import d3 from 'd3';
import tinycolor from 'tinycolor2';
import clusters from 'clusters';
import { createGraph, generateChart } from './chart.js';
import { WorkBoots } from './util/work-boots.js';

let href = document.location.href;
href = href.indexOf('index.html') > -1 ? href.replace('index.html', '') : href;
// as this runs from the dist directory, we want to generate multiple outputs
const workBoots = new WorkBoots({ socksFile: href + 'k-means-clustering-worker.js' });

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

document.addEventListener('ondrag', (e) => {
  e.preventDefault();
});

document.addEventListener('ondragstart', (e) => {
  e.preventDefault();
});

document.querySelector('.file-upload').onchange = function() {
  if (!this.files.length) return;
  runUpload(this.files[0]).then(image => {
    document.querySelector('svg')?.remove();
    const width = image.width;
    const height = image.height;

    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);

    workBoots.ready().then(() => {
      workBoots.onMessage(({ data }) => {
        if ('graphNodes' in data) {
          const { graphNodes } = data;
          const pallet = document.querySelector('.pallet');
          // for note this is a list of colors NEAREST their centroid
          graphNodes.forEach(centroid => {
            // const points = cluster.points.map(c => {
            //   const [h,s,v] = c;
            //   return tinycolor({h,s,v});
            // });
            //
            // points.sort((a, b) => a.getBrightness() - b.getBrightness())
            //const point = points[0];
            const div = document.createElement("div");
            div.style.cssText = `background-color: ${centroid.color}; width: 80px; height: 80px;`;

            pallet.append(div);
          });

          const graph = createGraph(graphNodes);

          const { svg, simulation } = generateChart(width, height, graph);

          document.querySelector('.image-container').append(svg);
        } else if ('progressUpdate' in data) {
          const { progressUpdate } = data;

          // progress!
          console.log("... progress!")
        }
      });

      let iterations = Number(document.querySelector('.iteration-count').value);
      iterations = (isNaN(iterations) || +iterations === 0) ? 10 : iterations
      let palletSize = Number(document.querySelector('.pallet-size').value);
      palletSize = (isNaN(palletSize) || +palletSize === 0) ? 10 : palletSize

      workBoots.postMessage({
        imageData: imageData.data,
        iterations,
        palletSize,
        width,
        height
      });
    });

    console.log(imageData);
  });
}
