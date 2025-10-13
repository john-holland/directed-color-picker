import tinycolor from 'tinycolor2';

/**
 * Custom Color Picker Modal
 * Dynamically injects HTML for full isolation from existing styles
 */
export class ColorPickerModal {
  constructor() {
    this.modal = null;
    this.onColorSelected = null;
    this.currentColor = '#ff0000';
  }

  /**
   * Create and inject the modal HTML
   */
  createModal() {
    // Remove existing modal if present
    const existing = document.querySelector('.dcp-color-modal-overlay');
    if (existing) {
      existing.remove();
    }

    const modalHTML = `
      <div class="dcp-color-modal-overlay" style="
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(5px);
      ">
        <div class="dcp-color-modal-container" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: dcp-modal-slide-in 0.3s ease-out;
        ">
          <div class="dcp-modal-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
          ">
            <h2 style="
              color: white;
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            ">🎨 Custom Color Picker</h2>
            <button class="dcp-close-btn" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              cursor: pointer;
              font-size: 20px;
              transition: all 0.2s;
              display: flex;
              align-items: center;
              justify-content: center;
            ">×</button>
          </div>
          
          <div class="dcp-color-preview-container" style="
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
          ">
            <div class="dcp-color-preview" style="
              width: 100%;
              height: 100px;
              border-radius: 10px;
              margin-bottom: 15px;
              background: #ff0000;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
              transition: all 0.3s;
            "></div>
            <input type="text" class="dcp-hex-input" value="#ff0000" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #667eea;
              border-radius: 8px;
              font-size: 18px;
              text-align: center;
              font-family: monospace;
              font-weight: bold;
              color: #333;
              background: #f8f9fa;
              transition: all 0.2s;
            "/>
          </div>
          
          <div class="dcp-sliders-container" style="
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 25px;
          ">
            <div class="dcp-slider-group" style="margin-bottom: 15px;">
              <label style="
                display: flex;
                justify-content: space-between;
                color: #e74c3c;
                font-weight: 600;
                margin-bottom: 8px;
              ">
                <span>Red</span>
                <span class="dcp-red-value">255</span>
              </label>
              <input type="range" class="dcp-red-slider" min="0" max="255" value="255" style="
                width: 100%;
                height: 8px;
                border-radius: 5px;
                outline: none;
                background: linear-gradient(to right, #000 0%, #ff0000 100%);
                -webkit-appearance: none;
              "/>
            </div>
            
            <div class="dcp-slider-group" style="margin-bottom: 15px;">
              <label style="
                display: flex;
                justify-content: space-between;
                color: #27ae60;
                font-weight: 600;
                margin-bottom: 8px;
              ">
                <span>Green</span>
                <span class="dcp-green-value">0</span>
              </label>
              <input type="range" class="dcp-green-slider" min="0" max="255" value="0" style="
                width: 100%;
                height: 8px;
                border-radius: 5px;
                outline: none;
                background: linear-gradient(to right, #000 0%, #00ff00 100%);
                -webkit-appearance: none;
              "/>
            </div>
            
            <div class="dcp-slider-group">
              <label style="
                display: flex;
                justify-content: space-between;
                color: #3498db;
                font-weight: 600;
                margin-bottom: 8px;
              ">
                <span>Blue</span>
                <span class="dcp-blue-value">0</span>
              </label>
              <input type="range" class="dcp-blue-slider" min="0" max="255" value="0" style="
                width: 100%;
                height: 8px;
                border-radius: 5px;
                outline: none;
                background: linear-gradient(to right, #000 0%, #0000ff 100%);
                -webkit-appearance: none;
              "/>
            </div>
          </div>
          
          <div class="dcp-actions" style="
            display: flex;
            gap: 15px;
          ">
            <button class="dcp-cancel-btn" style="
              flex: 1;
              padding: 14px;
              background: rgba(255, 255, 255, 0.2);
              color: white;
              border: 2px solid white;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">Cancel</button>
            <button class="dcp-add-btn" style="
              flex: 2;
              padding: 14px;
              background: white;
              color: #667eea;
              border: none;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            ">Add Color</button>
          </div>
        </div>
      </div>
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dcp-modal-slide-in {
        from {
          opacity: 0;
          transform: translateY(-30px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .dcp-close-btn:hover {
        background: rgba(255, 255, 255, 0.3) !important;
        transform: rotate(90deg);
      }
      
      .dcp-cancel-btn:hover {
        background: rgba(255, 255, 255, 0.3) !important;
        transform: translateY(-2px);
      }
      
      .dcp-add-btn:hover {
        background: #f0f0f0 !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }
      
      .dcp-hex-input:focus {
        outline: none;
        border-color: #764ba2 !important;
        box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.2);
      }
      
      /* Slider thumb styling */
      input[type="range"].dcp-red-slider::-webkit-slider-thumb,
      input[type="range"].dcp-green-slider::-webkit-slider-thumb,
      input[type="range"].dcp-blue-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      }
      
      input[type="range"].dcp-red-slider::-webkit-slider-thumb {
        background: #e74c3c;
      }
      
      input[type="range"].dcp-green-slider::-webkit-slider-thumb {
        background: #27ae60;
      }
      
      input[type="range"].dcp-blue-slider::-webkit-slider-thumb {
        background: #3498db;
      }
    `;
    
    document.head.appendChild(style);
    
    // Parse and inject HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(modalHTML, 'text/html');
    this.modal = doc.querySelector('.dcp-color-modal-overlay');
    document.body.appendChild(this.modal);
    
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to modal elements
   */
  attachEventListeners() {
    const closeBtn = this.modal.querySelector('.dcp-close-btn');
    const cancelBtn = this.modal.querySelector('.dcp-cancel-btn');
    const addBtn = this.modal.querySelector('.dcp-add-btn');
    const hexInput = this.modal.querySelector('.dcp-hex-input');
    const redSlider = this.modal.querySelector('.dcp-red-slider');
    const greenSlider = this.modal.querySelector('.dcp-green-slider');
    const blueSlider = this.modal.querySelector('.dcp-blue-slider');

    closeBtn.addEventListener('click', () => this.hide());
    cancelBtn.addEventListener('click', () => this.hide());
    addBtn.addEventListener('click', () => this.addColor());
    
    hexInput.addEventListener('input', () => this.updateFromHex());
    redSlider.addEventListener('input', () => this.updateFromSliders());
    greenSlider.addEventListener('input', () => this.updateFromSliders());
    blueSlider.addEventListener('input', () => this.updateFromSliders());
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  /**
   * Update color from hex input
   */
  updateFromHex() {
    const hexInput = this.modal.querySelector('.dcp-hex-input');
    const hexColor = hexInput.value;
    
    if (hexColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      const color = tinycolor(hexColor);
      const rgb = color.toRgb();
      
      this.modal.querySelector('.dcp-red-slider').value = rgb.r;
      this.modal.querySelector('.dcp-green-slider').value = rgb.g;
      this.modal.querySelector('.dcp-blue-slider').value = rgb.b;
      
      this.updatePreview(hexColor);
    }
  }

  /**
   * Update color from RGB sliders
   */
  updateFromSliders() {
    const r = parseInt(this.modal.querySelector('.dcp-red-slider').value);
    const g = parseInt(this.modal.querySelector('.dcp-green-slider').value);
    const b = parseInt(this.modal.querySelector('.dcp-blue-slider').value);
    
    const hexColor = tinycolor({ r, g, b }).toHexString();
    this.modal.querySelector('.dcp-hex-input').value = hexColor;
    
    this.updatePreview(hexColor);
  }

  /**
   * Update preview with current color
   */
  updatePreview(hexColor) {
    this.currentColor = hexColor;
    const preview = this.modal.querySelector('.dcp-color-preview');
    preview.style.backgroundColor = hexColor;
    
    // Update value displays
    const r = parseInt(this.modal.querySelector('.dcp-red-slider').value);
    const g = parseInt(this.modal.querySelector('.dcp-green-slider').value);
    const b = parseInt(this.modal.querySelector('.dcp-blue-slider').value);
    
    this.modal.querySelector('.dcp-red-value').textContent = r;
    this.modal.querySelector('.dcp-green-value').textContent = g;
    this.modal.querySelector('.dcp-blue-value').textContent = b;
  }

  /**
   * Show the modal
   */
  show() {
    if (!this.modal) {
      this.createModal();
    }
    this.modal.style.display = 'flex';
    
    // Reset to default color
    this.currentColor = '#ff0000';
    this.modal.querySelector('.dcp-hex-input').value = this.currentColor;
    this.modal.querySelector('.dcp-red-slider').value = 255;
    this.modal.querySelector('.dcp-green-slider').value = 0;
    this.modal.querySelector('.dcp-blue-slider').value = 0;
    this.updatePreview(this.currentColor);
  }

  /**
   * Hide the modal
   */
  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  /**
   * Add color and trigger callback
   */
  addColor() {
    const hexColor = this.currentColor;
    
    if (!hexColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      alert('Please enter a valid hex color');
      return;
    }
    
    if (this.onColorSelected) {
      this.onColorSelected(hexColor);
    }
    
    this.hide();
  }

  /**
   * Set callback for when color is selected
   */
  onSelect(callback) {
    this.onColorSelected = callback;
  }
}

