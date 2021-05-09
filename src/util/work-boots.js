
/**
    we should be able to include files with or without support of webworkers
    and use the same interface, although support for svg+d3 sort of makes this a
    pointless exercise...

    but just for kicks... lol

    One downside of this is it will require explicit output from webpack to make
    the local and web worker support work.
 */
class WorkBoots {
  constructor({ socksFile }) {
    if (socksFile === undefined) return; // WHY is this happening?
    this.supportsWorker = (typeof Worker !== 'undefined');
    this.readyPromise = new Promise((resolve, reject) => {
      if (this.supportsWorker) {
        try {
          //this.worker = new Worker(URL.createObjectURL(new Blob(["("+socksFile.toString()+")()"], {type: 'text/javascript'})));
          this.worker = new Worker(new URL(socksFile, import.meta.url));
          resolve(this);
        } catch (e) {
          this.supportsWorker = false;
          console.log('background worker not supported, switching to shorter socks (main thread eval).')
        }
      }
      if (!this.supportsWorker) {
        import(socksFile).then(({ socks }) => {
          this.socks = socks;
          this.socks.enterBoots(this);
          resolve(this);
        });
      }
    });
  }

  ready() {
    return this.readyPromise;
  }

  postMessage(data) {
    return new Promise((resolve, reject) => {
      if (this.supportsWorker) {
        this.worker.postMessage(data);
      } else {
        this.socks.onMessageLocal(data);
      }
    });
  }

  onMessage(callback) {
    return new Promise((resolve, reject) => {
      if (this.supportsWorker) {
        this.worker.onmessage = callback;
      } else {
        this.onMessageCallback = callback;
      }
    });
  }

  onMessageLocal(data) {
    if (this.onMessageCallback) {
      this.onMessageCallback(data);
    } else {
      throw new Error('onMessageLocal should not be called without onMessageCallback defined');
    }
  }

  terminate() {
    if (this.supportsWorker) {
      this.worker.terminate();
    } else {
      this.socks.terminate();
    }
  }
}

// strictly the client side of the worker
/**
E.X.:

const socks = new Socks(self);

socks.onMessage(...)

const someCoolFunction = () => {
  ...
  socks.postMessage(coolData);
};

export {
  socks
};

 */
class Socks {
  constructor({ self = undefined }) {
    this.self = self;
  }

  enterBoots(boots) {
    this.boots = boots;
  }

  postMessage(data) {
    if (this.self) {
      this.self.postMessage(data);
    } else {
      this.boots.onMessageLocal(data);
    }
  }

  onMessage(callback) {
    if (this.self) {
      this.self.onmessage = callback;
    } else {
      this.onMessageCallback = callback;
    }
  }

  onMessageLocal(data) {
    if (this.onMessageCallback) {
      this.onMessageCallback(data);
    } else {
      throw new Error('onMessageLocal should not be called without onMessageCallback defined');
    }
  }

  terminate() {
    this.terminateCallback();
  }

  onTerminate(callback) {
    // this is only called when we don't support service workers... beware1!!!1
    this.terminateCallback = callback;
  }
}

export {
  WorkBoots,
  Socks
};
