import { createActor } from 'xstate';
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
    this.actors = {};
    
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
      this.actors[componentId] = createActor(machine);
      
      // Subscribe to state changes
      this.actors[componentId].subscribe(snapshot => {
        this.onViewStateChange(componentId, snapshot);
      });
      
      this.actors[componentId].start();
    });
  }

  /**
   * Handle view state changes
   */
  onViewStateChange(componentId, snapshot) {
    console.log(`View [${componentId}]: ${snapshot.value}`, snapshot.context);
    
    // Update DOM based on state
    switch (componentId) {
      case 'loading':
        this.updateLoadingState(snapshot);
        break;
      case 'statusMessage':
        this.updateStatusMessage(snapshot);
        break;
      case 'paletteManagement':
        this.updatePaletteManagementVisibility(snapshot);
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
  updateLoadingState(snapshot) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      if (snapshot.matches({ loading: {} }) || snapshot.value === 'loading') {
        loadingElement.classList.add('show');
      } else {
        loadingElement.classList.remove('show');
      }
    }
  }

  /**
   * Update status message
   */
  updateStatusMessage(snapshot) {
    const statusElement = document.getElementById('copy-status');
    if (statusElement && snapshot.context.message) {
      statusElement.textContent = snapshot.context.message;
      
      if (snapshot.matches({ success: {} }) || snapshot.value === 'success') {
        setTimeout(() => {
          statusElement.textContent = '';
        }, 2000);
      }
    }
  }

  /**
   * Update palette management section visibility
   */
  updatePaletteManagementVisibility(snapshot) {
    const paletteManagement = document.getElementById('palette-management');
    if (paletteManagement) {
      if (snapshot.matches({ visible: {} }) || snapshot.value === 'visible') {
        paletteManagement.style.display = 'block';
      } else if (snapshot.matches({ hidden: {} }) || snapshot.value === 'hidden') {
        paletteManagement.style.display = 'none';
      }
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.actors.statusMessage.send({
      type: 'SUCCESS',
      message: message
    });
  }

  /**
   * Show error message
   */
  showError(error) {
    this.actors.statusMessage.send({
      type: 'ERROR',
      error: error
    });
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.actors.loading.send({ type: 'LOAD' });
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.actors.loading.send({ type: 'LOADED' });
  }

  /**
   * Show palette management section
   */
  showPaletteManagement() {
    this.actors.paletteManagement.send({ type: 'SHOW' });
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
   * Cleanup and stop all actors
   */
  destroy() {
    Object.values(this.actors).forEach(actor => {
      actor.stop();
    });
  }
}


