import tinycolor from 'tinycolor2';

/**
 * Palette Manager
 * Business logic layer for palette operations
 * Pure functions without DOM dependencies
 */
export class PaletteManager {
  constructor(stateMachine) {
    this.stateMachine = stateMachine;
    this.listeners = new Map();
  }

  /**
   * Subscribe to palette events
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  /**
   * Load saved palettes from localStorage
   */
  loadSavedPalettes() {
    try {
      const saved = localStorage.getItem('savedPalettes');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved palettes:', error);
      return [];
    }
  }

  /**
   * Save palette to localStorage
   */
  savePalette(palette, name) {
    try {
      const savedPalettes = this.loadSavedPalettes();
      const paletteData = {
        colors: palette,
        timestamp: new Date().toISOString(),
        name: name || `Palette ${savedPalettes.length + 1}`
      };
      
      savedPalettes.push(paletteData);
      localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
      
      this.emit('palette:saved', paletteData);
      return paletteData;
    } catch (error) {
      console.error('Error saving palette:', error);
      throw error;
    }
  }

  /**
   * Delete saved palette
   */
  deleteSavedPalette(index) {
    try {
      const savedPalettes = this.loadSavedPalettes();
      if (index >= 0 && index < savedPalettes.length) {
        const deleted = savedPalettes.splice(index, 1)[0];
        localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes));
        this.emit('palette:deleted', { index, palette: deleted });
        return deleted;
      }
      return null;
    } catch (error) {
      console.error('Error deleting palette:', error);
      throw error;
    }
  }

  /**
   * Generate split complement colors
   */
  generateSplitComplements(baseColor) {
    const baseHue = baseColor.hsv.h;
    
    const split1 = tinycolor({ 
      h: (baseHue + 150) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    const split2 = tinycolor({ 
      h: (baseHue + 210) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    return [
      {
        hex: split1.toHexString(),
        rgb: split1.toRgb(),
        hsv: split1.toHsv(),
        source: 'split-complement-1'
      },
      {
        hex: split2.toHexString(),
        rgb: split2.toRgb(),
        hsv: split2.toHsv(),
        source: 'split-complement-2'
      }
    ];
  }

  /**
   * Generate triad colors
   */
  generateTriads(baseColor) {
    const baseHue = baseColor.hsv.h;
    
    const triad1 = tinycolor({ 
      h: (baseHue + 120) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    const triad2 = tinycolor({ 
      h: (baseHue + 240) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    return [
      {
        hex: triad1.toHexString(),
        rgb: triad1.toRgb(),
        hsv: triad1.toHsv(),
        source: 'component-triad-1'
      },
      {
        hex: triad2.toHexString(),
        rgb: triad2.toRgb(),
        hsv: triad2.toHsv(),
        source: 'component-triad-2'
      }
    ];
  }

  /**
   * Generate quad colors
   */
  generateQuads(baseColor) {
    const baseHue = baseColor.hsv.h;
    
    const quad1 = tinycolor({ 
      h: (baseHue + 90) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    const quad2 = tinycolor({ 
      h: (baseHue + 180) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    const quad3 = tinycolor({ 
      h: (baseHue + 270) % 360, 
      s: baseColor.hsv.s, 
      v: baseColor.hsv.v 
    });
    
    return [
      {
        hex: quad1.toHexString(),
        rgb: quad1.toRgb(),
        hsv: quad1.toHsv(),
        source: 'component-quad-1'
      },
      {
        hex: quad2.toHexString(),
        rgb: quad2.toRgb(),
        hsv: quad2.toHsv(),
        source: 'component-quad-2'
      },
      {
        hex: quad3.toHexString(),
        rgb: quad3.toRgb(),
        hsv: quad3.toHsv(),
        source: 'component-quad-3'
      }
    ];
  }

  /**
   * Export palette to various formats
   */
  exportPalette(palette, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(palette, null, 2);
      
      case 'css':
        return palette.map((color, i) => 
          `--color-${i + 1}: ${color.hex};`
        ).join('\n');
      
      case 'scss':
        return palette.map((color, i) => 
          `$color-${i + 1}: ${color.hex};`
        ).join('\n');
      
      case 'array':
        return palette.map(color => color.hex);
      
      default:
        return JSON.stringify(palette, null, 2);
    }
  }

  /**
   * Duplicate entire palette
   */
  duplicatePalette(palette) {
    return palette.map(color => ({
      hex: color.hex,
      rgb: { ...color.rgb },
      hsv: { ...color.hsv },
      source: `${color.source}-duplicate`
    }));
  }

  /**
   * Create custom color from hex
   */
  createColorFromHex(hexColor) {
    const color = tinycolor(hexColor);
    return {
      hex: hexColor,
      rgb: color.toRgb(),
      hsv: color.toHsv(),
      source: 'custom-color'
    };
  }

  /**
   * Validate hex color
   */
  isValidHexColor(hex) {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  }
}

