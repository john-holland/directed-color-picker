# Palette Management System

The Directed Color Picker now includes a comprehensive palette management system that allows users to save, edit, and enhance their color palettes using color theory principles.

## Features

### 🎨 Copy Current Palette
- **Copy Palette Button**: After generating a palette or adding colors manually, click "📋 Copy Current Palette" to save it to local storage
- **Automatic Display**: The palette management section appears automatically when colors are generated or added

### 💾 Saved Palettes
- **Local Storage**: All palettes are automatically saved to your browser's local storage
- **Persistent Storage**: Palettes persist between browser sessions
- **Quick Access**: Click on any saved palette to load it back into the active editor

### ✏️ Active Palette Editor
- **Color Selection**: Click on any color in the active palette to select it (selected colors have a blue border)
- **Remove Colors**: Hover over colors to reveal a red "×" button for removal
- **Add Custom Colors**: Use the "➕ Add Custom Color" button to open a color picker modal

### 🎭 Color Theory Functions
- **Split Complements**: Generate two colors that are 150° and 210° from a selected base color
- **Component Triads**: Generate two colors that are 120° and 240° from a selected base color  
- **Component Quads**: Generate three colors that are 90°, 180°, and 270° from a selected base color

### 🎨 Custom Color Picker
- **Hex Input**: Enter hex color codes directly (e.g., #ff0000)
- **RGB Sliders**: Fine-tune colors using red, green, and blue sliders
- **Live Preview**: See color changes in real-time
- **Validation**: Automatic validation of hex color input

### 🔄 Palette Controls
- **Reset Palette**: Restore the palette to its original generated state
- **Clear All**: Remove all colors from the current palette
- **Export**: Download the current palette as a JSON file

## How to Use

### 1. Generate a Palette
1. Upload an image using drag & drop or file selection
2. Click "Run Analysis" to generate colors
3. The palette management section will automatically appear

### 2. Save a Palette
1. Click "📋 Copy Current Palette" 
2. Your palette is automatically saved to local storage
3. View saved palettes in the "💾 Saved Palettes" section

### 3. Edit Colors
1. **Select Colors**: Click on colors in the active palette to select them
2. **Remove Colors**: Hover over colors and click the red "×" button
3. **Add Colors**: Use the custom color picker or double-click on the image

### 4. Apply Color Theory
1. Select a base color from your palette
2. Choose a color theory function:
   - **Split Complements**: Creates harmonious color combinations
   - **Component Triads**: Creates balanced three-color schemes
   - **Component Quads**: Creates four-color square schemes

### 5. Load Saved Palettes
1. Click on any saved palette in the list
2. The palette will be loaded into the active editor
3. Continue editing or apply color theory functions

## Technical Implementation

### State Management
- **log-view-machine**: Uses the log-view-machine library for state management
- **RobotCopy**: Integrates with RobotCopy for message tracking and tracing
- **Local Storage**: Persistent storage of palettes using browser localStorage

### Color Theory Algorithms
- **HSV Color Space**: All calculations use HSV (Hue, Saturation, Value) for accurate color relationships
- **Mathematical Precision**: Color angles are calculated using precise mathematical formulas
- **TinyColor2**: Leverages the tinycolor2 library for color conversions and manipulations

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Visual Feedback**: Clear visual indicators for selections, hover states, and actions
- **Intuitive Interface**: Simple, clean design that doesn't interfere with the main color picker

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Local Storage**: Requires localStorage support
- **ES6 Modules**: Requires ES6 module support

## Future Enhancements

- **Cloud Storage**: Save palettes to cloud services
- **Social Sharing**: Share palettes with other users
- **Advanced Color Theory**: Additional color harmony rules and algorithms
- **Palette Templates**: Pre-designed palette starting points
- **Export Formats**: Support for additional export formats (CSS, SCSS, etc.)

## Troubleshooting

### Palette Not Saving
- Ensure your browser supports localStorage
- Check browser console for any JavaScript errors
- Try refreshing the page and generating a new palette

### Colors Not Displaying
- Verify the image format is supported (PNG, JPG, JPEG, GIF, BMP, WebP)
- Check that the image file isn't corrupted
- Ensure the image has sufficient color variation

### Color Theory Not Working
- Make sure you've selected a base color first
- Verify the selected color is visible in the active palette
- Check that the palette contains valid color data

For additional support or feature requests, please refer to the main project documentation.
