import { interpret } from 'xstate';
import { createViewStateMachine } from './viewStateMachine.js';

/**
 * UI Controller
 * Manages DOM updates and UI state using ViewStateMachine
 * Subscribes to business logic events and updates the view accordingly
 */
export class UIController {
  constructor(paletteManager) {
    this.paletteManager = paletteManager;
    this.viewMachines = {};
    this.services = {};
    
    // Create view state machines for different components
    this.initializeViewMachines();
    
    // Subscribe to business logic events
    this.subscribeToBusinessEvents();
  }

  /**
   * Initialize view state machines for UI components
   */
  initializeViewMachines() {
    const components = [
      'paletteManagement',
      'savedPalettes',
      'activePalette',
      'colorPicker',
      'loading',
      'statusMessage'
    ];
    
    components.forEach(componentId => {
      const machine = createViewStateMachine(componentId);
      this.viewMachines[componentId] = machine;
      this.services[componentId] = interpret(machine);
      
      // Subscribe to state changes
      this.services[componentId].onTransition(state => {
        this.onViewStateChange(componentId, state);
      });
      
      this.services[componentId].start();
    });
  }

  /**
   * Handle view state changes
   */
  onViewStateChange(componentId, state) {
    console.log(`View [${componentId}]: ${state.value}`, state.context);
    
    // Update DOM based on state
    switch (componentId) {
      case 'loading':
        this.updateLoadingState(state);
        break;
      case 'statusMessage':
        this.updateStatusMessage(state);
        break;
      case 'paletteManagement':
        this.updatePaletteManagementVisibility(state);
        break;
    }
  }

  /**
   * Subscribe to business logic events
   */
  subscribeToBusinessEvents() {
    this.paletteManager.on('palette:saved', (data) => {
      this.showSuccess('Palette saved successfully!');
      this.updateSavedPalettesList();
    });
    
    this.paletteManager.on('palette:deleted', (data) => {
      this.showSuccess('Palette deleted!');
      this.updateSavedPalettesList();
    });
  }

  /**
   * Update loading indicator
   */
  updateLoadingState(state) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      if (state.matches('loading')) {
        loadingElement.classList.add('show');
      } else {
        loadingElement.classList.remove('show');
      }
    }
  }

  /**
   * Update status message
   */
  updateStatusMessage(state) {
    const statusElement = document.getElementById('copy-status');
    if (statusElement && state.context.message) {
      statusElement.textContent = state.context.message;
      
      if (state.matches('success')) {
        setTimeout(() => {
          statusElement.textContent = '';
        }, 2000);
      }
    }
  }

  /**
   * Update palette management section visibility
   */
  updatePaletteManagementVisibility(state) {
    const paletteManagement = document.getElementById('palette-management');
    if (paletteManagement) {
      if (state.matches('visible')) {
        paletteManagement.style.display = 'block';
      } else if (state.matches('hidden')) {
        paletteManagement.style.display = 'none';
      }
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.services.statusMessage.send({
      type: 'SUCCESS',
      message: message
    });
  }

  /**
   * Show error message
   */
  showError(error) {
    this.services.statusMessage.send({
      type: 'ERROR',
      error: error
    });
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.services.loading.send('LOAD');
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.services.loading.send('LOADED');
  }

  /**
   * Show palette management section
   */
  showPaletteManagement() {
    this.services.paletteManagement.send('SHOW');
  }

  /**
   * Update saved palettes list in the DOM
   */
  updateSavedPalettesList() {
    const savedPalettesList = document.getElementById('saved-palettes-list');
    if (!savedPalettesList) return;
    
    const savedPalettes = this.paletteManager.loadSavedPalettes();
    savedPalettesList.innerHTML = '';
    
    savedPalettes.forEach((palette, index) => {
      const paletteItem = document.createElement('div');
      paletteItem.className = 'saved-palette-item';
      paletteItem.title = `Created: ${new Date(palette.timestamp).toLocaleString()}`;
      
      // Create text span
      const textSpan = document.createElement('span');
      textSpan.className = 'saved-palette-item-text';
      textSpan.textContent = `Palette ${index + 1} (${palette.colors.length} colors)`;
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-palette-btn';
      deleteBtn.textContent = '×';
      deleteBtn.title = 'Delete this palette';
      
      // Delete button click handler
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete Palette ${index + 1} (${palette.colors.length} colors)?\n\nThis action cannot be undone.`)) {
          this.paletteManager.deleteSavedPalette(index);
        }
      });
      
      // Text span click handler (load palette) - will be wired by main controller
      textSpan.addEventListener('click', () => {
        this.emit('loadPalette', { index, palette });
      });
      
      paletteItem.appendChild(textSpan);
      paletteItem.appendChild(deleteBtn);
      savedPalettesList.appendChild(paletteItem);
    });
  }

  /**
   * Simple event emitter for UI events
   */
  emit(event, data) {
    const customEvent = new CustomEvent(`ui:${event}`, { detail: data });
    window.dispatchEvent(customEvent);
  }

  /**
   * Cleanup and stop all services
   */
  destroy() {
    Object.values(this.services).forEach(service => {
      service.stop();
    });
  }
}

