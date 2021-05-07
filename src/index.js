import d3_force from 'd3-force';
import d3 from 'd3';
import tinycolor from 'tinycolor2';
import clusters from 'clusters';

// get the image
// run k-means clustering on the hsl color values

// convert them to hex and display the:
//  * highest saturation?
//  * brightest?
//  * highest light values

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
    //const colors = [];
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
      // rgba.x = i / 4 % width;
      // rgba.y = Math.floor(i / 4 / width);
      // colors.push(rgba);
    }

    //number of clusters, defaults to undefined
    clusters.k(10);

    //number of iterations (higher number gives more time to converge), defaults to 1000
    clusters.iterations(3);//Number(document.querySelector('.iteration-count')));

    //data from which to identify clusters, defaults to []
    clusters.data(hsvArray);

    console.log(clusters.clusters());
    const pallet = document.querySelector('.pallet');
    clusters.clusters().forEach(cluster => {
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
    })

    console.log(imageData);
  });
}
