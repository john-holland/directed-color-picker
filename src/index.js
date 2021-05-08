import d3_force from 'd3-force';
import d3 from 'd3';
import tinycolor from 'tinycolor2';
import clusters from 'clusters';
import { createGraph, generateChart } from './chart';

// get the image
// run k-means clustering on the hsl color values

// convert them to hex and display the:
//  * highest saturation?
//  * brightest?
//  * highest light values

/**
 *  todo:
 *   - use background worker instead of locking up the page
 *   - parameterize the iteration count for k nearest neighbors
 *   - maybe support image scaling for faster, high iteration knn
 *   - it seems like it doesn't find examples for each of the colors, which odd?
 *   - drag and drop needs prevent default for files etc so the browser doesn't just load them
 *   - consider switching the current knn implementation for the clairvoyance impl,
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

const v3distance = (v1, v2) => {
  const x = v1[0] - v2[0];
  const y = v1[1] - v2[1];
  const z = v1[2] - v2[2];
  return Math.pow(x*x + y*y + z*z, 0.5)
}

document.querySelector('.file-upload').onchange = function() {
  if (!this.files.length) return;
  runUpload(this.files[0]).then(image => {
    const width = image.width;
    const height = image.height;

    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, width, height);

    const hsvArray = [];
    const colors = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      // Modify pixel data
      const rgba = tinycolor({
        r: imageData.data[i + 0],
        g: imageData.data[i + 1],
        b: imageData.data[i + 2],
        a: imageData.data[i + 3]
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

    //number of clusters, defaults to undefined
    clusters.k(10);

    //number of iterations (higher number gives more time to converge), defaults to 1000
    clusters.iterations(10);//Number(document.querySelector('.iteration-count')));

    //data from which to identify clusters, defaults to []
    clusters.data(hsvArray);

    console.log(clusters.clusters());
    const pallet = document.querySelector('.pallet');
    const nodeClusters = clusters.clusters();
    const centroids = nodeClusters.map(n => n.centroid);
    nodeClusters.forEach(cluster => {
      // const points = cluster.points.map(c => {
      //   const [h,s,v] = c;
      //   return tinycolor({h,s,v});
      // });
      //
      // points.sort((a, b) => a.getBrightness() - b.getBrightness())
      const [h,s,v] = cluster.centroid;
      const centroid = tinycolor({ h, s, v });
      //const point = points[0];
      const div = document.createElement("div");
      div.style.cssText = `background-color: ${centroid.toHexString()}; width: 80px; height: 80px;`;

      pallet.append(div);
    });

    const graphNodes = centroids.map(c => {
      const [h,s,v] = c;
      const centroidHSV = [h,s,v];
      const color = tinycolor({ h,s,v }).toHexString();
      let ex = undefined;
      colors.reduce((a, c) => {
        const distance = v3distance(centroidHSV, c.hsv);
        if (distance < a) {
          ex = c;
          return distance;
        } else {
          return a;
        }
      }, 1000000);
      // this could be a little better... :shrug:
      const example = ex;

      if (!example) {
        console.log(`unable to find color example for color: ${color}`);
        return undefined;
      }
      return {
        x: example.x,
        y: example.y,
        color: color
      };
    }).filter(c => !!c);

    const graph = createGraph(graphNodes);

    const { svg, simulation } = generateChart(width, height, graph);
    document.querySelector('.image-container').append(svg);

    console.log(imageData);
  });
}
