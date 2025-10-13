import { createMachine, assign } from 'xstate';

/**
 * Palette State Machine
 * Manages the lifecycle of palette generation, editing, and persistence
 */
export const paletteStateMachine = createMachine({
  id: 'palette',
  initial: 'idle',
  context: {
    currentPalette: [],
    mainPalette: [],
    workingPalette: [],
    savedPalettes: [],
    selectedColors: [],
    imageData: null,
    configuration: {
      iterations: 4,
      paletteSize: 20,
      hsvTolerance: 30,
      toleranceEnabled: true,
      distanceMethod: 'hsv-max'
    },
    error: null,
    progress: 0
  },
  states: {
    idle: {
      on: {
        UPLOAD_IMAGE: {
          target: 'uploading',
          actions: assign({
            imageData: ({ event }) => event.imageData
          })
        },
        LOAD_SAVED_PALETTE: {
          target: 'paletteReady',
          actions: assign({
            currentPalette: ({ event }) => event.palette,
            mainPalette: ({ event }) => event.palette,
            workingPalette: ({ event }) => event.palette
          })
        }
      }
    },
    uploading: {
      on: {
        UPLOAD_COMPLETE: {
          target: 'imageReady'
        },
        UPLOAD_ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    imageReady: {
      on: {
        RUN_ANALYSIS: {
          target: 'analyzing',
          actions: assign({
            configuration: ({ context, event }) => ({
              ...context.configuration,
              ...event.configuration
            }),
            progress: () => 0
          })
        },
        UPLOAD_IMAGE: {
          target: 'uploading',
          actions: assign({
            imageData: ({ event }) => event.imageData
          })
        }
      }
    },
    analyzing: {
      on: {
        ANALYSIS_PROGRESS: {
          actions: assign({
            progress: ({ event }) => event.progress
          })
        },
        ANALYSIS_COMPLETE: {
          target: 'paletteReady',
          actions: assign({
            currentPalette: ({ event }) => event.palette,
            mainPalette: ({ event }) => event.palette,
            workingPalette: ({ event }) => event.palette,
            progress: () => 100
          })
        },
        ANALYSIS_ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    paletteReady: {
      on: {
        EDIT_PALETTE: {
          target: 'editing'
        },
        SAVE_PALETTE: {
          target: 'saving'
        },
        EXPORT_PALETTE: {
          target: 'exporting'
        },
        RUN_ANALYSIS: {
          target: 'analyzing',
          actions: assign({
            configuration: ({ context, event }) => ({
              ...context.configuration,
              ...event.configuration
            }),
            progress: () => 0
          })
        },
        RESET_PALETTE: {
          actions: assign({
            workingPalette: ({ context }) => [...context.mainPalette],
            currentPalette: ({ context }) => [...context.mainPalette]
          })
        },
        CLEAR_PALETTE: {
          actions: assign({
            workingPalette: () => [],
            currentPalette: () => []
          })
        }
      }
    },
    editing: {
      on: {
        ADD_COLOR: {
          actions: assign({
            workingPalette: ({ context, event }) => [...context.workingPalette, event.color],
            currentPalette: ({ context, event }) => [...context.currentPalette, event.color]
          })
        },
        REMOVE_COLOR: {
          actions: assign({
            workingPalette: ({ context, event }) => {
              const newPalette = [...context.workingPalette];
              newPalette.splice(event.index, 1);
              return newPalette;
            },
            currentPalette: ({ context, event }) => {
              const newPalette = [...context.currentPalette];
              newPalette.splice(event.index, 1);
              return newPalette;
            }
          })
        },
        DUPLICATE_PALETTE: {
          actions: assign({
            workingPalette: ({ context }) => [...context.workingPalette, ...context.workingPalette],
            currentPalette: ({ context }) => [...context.currentPalette, ...context.currentPalette]
          })
        },
        APPLY_COLOR_THEORY: {
          actions: assign({
            workingPalette: ({ context, event }) => [...context.workingPalette, ...event.newColors],
            currentPalette: ({ context, event }) => [...context.currentPalette, ...event.newColors]
          })
        },
        DONE_EDITING: {
          target: 'paletteReady'
        }
      }
    },
    saving: {
      invoke: {
        src: 'savePalette',
        onDone: {
          target: 'paletteReady'
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    exporting: {
      invoke: {
        src: 'exportPalette',
        onDone: {
          target: 'paletteReady'
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    error: {
      on: {
        RETRY: {
          target: 'idle',
          actions: assign({
            error: () => null
          })
        },
        DISMISS_ERROR: {
          target: 'idle',
          actions: assign({
            error: () => null
          })
        }
      }
    }
  }
});


