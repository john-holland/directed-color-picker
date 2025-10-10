import { createMachine, assign } from 'xstate';

/**
 * View State Machine
 * Manages UI rendering states and component visibility
 */
export const createViewStateMachine = (componentId) => createMachine({
  id: `view-${componentId}`,
  initial: 'hidden',
  context: {
    componentId: componentId,
    message: null,
    data: null,
    lastError: null
  },
  states: {
    hidden: {
      on: {
        SHOW: 'visible',
        LOAD: 'loading'
      }
    },
    visible: {
      on: {
        HIDE: 'hidden',
        LOAD: 'loading',
        ERROR: {
          target: 'error',
          actions: assign({
            lastError: (context, event) => event.error
          })
        },
        SUCCESS: {
          target: 'success',
          actions: assign({
            message: (context, event) => event.message
          })
        }
      }
    },
    loading: {
      entry: assign({
        message: 'Loading...'
      }),
      on: {
        LOADED: {
          target: 'visible',
          actions: assign({
            data: (context, event) => event.data,
            message: null
          })
        },
        ERROR: {
          target: 'error',
          actions: assign({
            lastError: (context, event) => event.error,
            message: null
          })
        },
        CANCEL: 'visible'
      }
    },
    success: {
      entry: assign({
        message: (context, event) => event.message || 'Success!'
      }),
      after: {
        2000: {
          target: 'visible',
          actions: assign({
            message: null
          })
        }
      },
      on: {
        DISMISS: {
          target: 'visible',
          actions: assign({
            message: null
          })
        }
      }
    },
    error: {
      on: {
        RETRY: 'loading',
        DISMISS: {
          target: 'visible',
          actions: assign({
            lastError: null,
            message: null
          })
        },
        HIDE: {
          target: 'hidden',
          actions: assign({
            lastError: null,
            message: null
          })
        }
      }
    }
  }
});

/**
 * Creates multiple view state machines for different components
 */
export const createViewStateMachines = (componentIds) => {
  const machines = {};
  componentIds.forEach(id => {
    machines[id] = createViewStateMachine(id);
  });
  return machines;
};

