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
const startClustering = ({ imageData, iterations = 10, palletSize = 10, width, height }) => {
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
      finished({ centroids, imageData, colors });
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

socks.ready();
readyCalled = true;

export {
  socks
};
