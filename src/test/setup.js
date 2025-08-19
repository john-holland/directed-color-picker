// Test setup file for Jest

// Mock canvas for image processing tests
global.HTMLCanvasElement = class {
  constructor() {}
  getContext() {
    return {
      getImageData: () => ({
        data: new Uint8ClampedArray(400) // Mock 10x10 image with RGBA data
      }),
      putImageData: () => {},
      drawImage: () => {}
    };
  }
};

// Mock Image for testing
global.Image = class {
  constructor() {
    setTimeout(() => {
      this.onload && this.onload();
    }, 0);
  }
};

// Mock D3 for testing
global.d3 = {
  create: () => ({
    attr: () => ({
      attr: () => ({
        attr: () => ({})
      })
    }),
    node: () => ({})
  }),
  forceSimulation: () => ({
    nodes: () => ({
      force: () => ({
        force: () => ({
          force: () => ({
            on: () => ({
              on: () => ({})
            })
          })
        })
      })
    }),
    alpha: () => ({
      restart: () => {}
    })
  }),
  drag: () => ({
    on: () => ({
      on: () => ({})
    })
  }),
  select: () => ({
    classed: () => ({
      classed: () => {}
    }),
    transition: () => ({
      duration: () => ({
        attr: () => {}
      })
    })
  }),
  selectAll: () => ({
    data: () => ({
      join: () => ({
        attr: () => ({
          style: () => ({
            classed: () => ({
              call: () => ({
                on: () => ({})
              })
            })
          })
        })
      })
    })
  })
};
