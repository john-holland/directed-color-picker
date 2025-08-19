# Testing Suite for Directed Color Picker

This directory contains comprehensive tests for the directed color picker application, focusing on initialization, k-means clustering, and flag color detection.

## Test Structure

### Core Tests
- **`chart.test.js`** - Tests for chart initialization and graph creation
- **`k-means.test.js`** - Tests for k-means clustering functionality
- **`image-utils.test.js`** - Tests for image processing utility functions
- **`flag-color-detection.test.js`** - Tests for flag color detection using the flag images

### Test Data
- **`color_map.json`** - Color palette data for country flags
- **Flag images** - PNG files for various countries (china.png, england.png, france.png, etc.)

### Utility Files
- **`image-utils.js`** - Helper functions for color processing and analysis
- **`setup.js`** - Jest configuration and mocks

## Running Tests

### Basic Test Run
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Coverage

### Chart Initialization Tests
- Graph creation with empty and populated node arrays
- Node-link relationship validation
- Chart generation with various dimensions
- Edge case handling (undefined coordinates, various color formats)

### K-Means Clustering Tests
- Basic clustering functionality with 2D data
- Color clustering effectiveness
- Flag color clustering validation
- ClusterMaker configuration and validation
- Edge cases (single cluster, default k values)

### Image Utility Tests
- RGB to hex conversion and vice versa
- Color distance calculations
- Color tolerance checking
- Closest color finding
- Dominant color extraction
- Color grouping and averaging

### Flag Color Detection Tests
- Color map validation and structure
- Individual country flag color analysis
- Color tolerance testing across different levels
- Multi-country color analysis
- Color distance analysis between flags
- Flag color uniqueness validation

## Test Data Sources

The flag images and color data are sourced from [ipregistry.co/blog/free-country-flags](https://ipregistry.co/blog/free-country-flags) and serve as simple color keys for testing the palette color detection system.

## Color Tolerance

The tests validate that the palette color detection can reveal colors within tolerance or exact matches given the solid color fills on the flags presented. This ensures the k-means clustering algorithm can effectively identify and group similar colors from real-world image data.

## Mocking

The test suite includes mocks for:
- Canvas API (for image processing tests)
- Image loading
- D3.js (for chart generation tests)

This allows testing of the core logic without requiring actual DOM manipulation or image loading.

## Adding New Tests

When adding new functionality:
1. Create test files following the naming convention `*.test.js`
2. Group related tests using `describe` blocks
3. Use descriptive test names that explain the expected behavior
4. Include edge cases and error conditions
5. Test both valid and invalid inputs

## Performance Considerations

The k-means clustering tests use the sequencer system to handle computationally expensive operations. Tests are designed to complete within reasonable time limits while still validating the core functionality.

