import { Socks } from '../util/work-boots';
import { Sequence } from './sequencer';
import { kmeans } from './k-means-clustering';
import tinycolor from 'tinycolor2';

const socks = new Socks({ self });

socks.onMessage(({ data }) => {
  if ('imageData' in data) {
    startClustering(data);
  }
});

const PROGRESS_UPDATE_STEP = 10;
const startClustering = ({ imageData, iterations = 10, palletSize = 10, width, height }) => {
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
      finished({ centroids, imageData, colors });
    });

  while (sequence.hasExec()) {
    sequence.exec();
    progressUpdate();
  }
}

const progressUpdate = () => {
  socks.postMessage({ progressUpdate: true });
}

const v3distance = (v1, v2) => {
  const x = v1[0] - v2[0];
  const y = v1[1] - v2[1];
  const z = v1[2] - v2[2];
  return Math.pow(x*x + y*y + z*z, 0.5)
}

const finished = ({ centroids, imageData, colors }) => {
  const graphNodes = centroids
    .map(c => c.location())
    .map(c => {
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
    })
    .filter(c => !!c);

  socks.postMessage({ graphNodes });
}

export {
  socks
};
