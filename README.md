# Directed Color Picker 🎨

A force-directed graph color picker that uses K-means clustering to extract color palettes from images. Upload any image and watch as the algorithm identifies dominant colors and creates an interactive force-directed visualization.

## Features

- **Image Upload**: Drag and drop or select images (PNG, JPG, JPEG, GIF, BMP, WebP)
- **K-means Clustering**: Automatically extracts dominant colors using configurable parameters
- **Force-Directed Visualization**: Interactive D3.js graph showing color relationships
- **Background Processing**: Uses Web Workers for non-blocking image processing
- **Customizable Parameters**: Adjust iteration count and palette size
- **Real-time Progress**: See processing updates in real-time

## Live Demo

Visit the live application: [https://john-holland.github.io/color-picker](https://john-holland.github.io/color-picker)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/john-holland/directed-color-picker.git
cd directed-color-picker
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. For development with watch mode:
```bash
npm run watch
```

## Usage

1. Open `dist/index.html` in your browser
2. Adjust the iteration count and palette size if desired
3. Upload an image using the file input
4. Watch as the algorithm processes the image and creates the color palette
5. Interact with the force-directed graph visualization

## Parameters

- **Iterations**: Number of K-means clustering iterations (default: 10)
- **Palette Size**: Number of colors to extract (default: 10)

## Technology Stack

- **D3.js**: Force-directed graph visualization
- **TinyColor2**: Color manipulation and conversion
- **WorkBoots**: Web Worker management for background processing
- **K-means Clustering**: Color extraction algorithm
- **Webpack**: Build system and bundling

## Development

The project uses Webpack for bundling. Key files:

- `src/index.js`: Main application logic
- `src/chart.js`: D3.js visualization components
- `src/algorithms/`: K-means clustering implementation
- `webpack.config.js`: Build configuration

## Deployment to GitHub Pages

1. Build the project:
```bash
npm run build
```

2. The `dist/` directory contains the built files ready for deployment

3. Configure GitHub Pages to serve from the `dist/` directory or deploy the contents to your GitHub Pages branch

## License

MIT License - except for the Marika Boniuk portrait, all copyright belongs to Marika Boniuk.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Marika Boniuk for the portrait image
- D3.js community for the force-directed graph implementation
- The Web Workers API for enabling background processing 