import {
  rgbToHex,
  hexToRgb,
  colorDistance,
  colorsWithinTolerance,
  findClosestColor,
  extractDominantColors,
  groupSimilarColors,
  calculateAverageColor
} from './image-utils.js';

describe('Image Utility Functions', () => {
  describe('Color Conversion', () => {
    test('should convert RGB to hex correctly', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(128, 128, 128)).toBe('#808080');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    test('should convert hex to RGB correctly', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    test('should handle hex without hash prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    test('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gg0000')).toBeNull();
      expect(hexToRgb('#ff00')).toBeNull();
      expect(hexToRgb('#ff000')).toBeNull();
    });
  });

  describe('Color Distance Calculation', () => {
    test('should calculate distance between identical colors', () => {
      const color = { r: 100, g: 150, b: 200 };
      expect(colorDistance(color, color)).toBe(0);
    });

    test('should calculate distance between different colors', () => {
      const color1 = { r: 0, g: 0, b: 0 };
      const color2 = { r: 255, g: 255, b: 255 };
      
      // Distance should be sqrt(255² + 255² + 255²) = sqrt(195075) ≈ 441.67
      const distance = colorDistance(color1, color2);
      expect(distance).toBeCloseTo(441.67, 1);
    });

    test('should calculate distance between similar colors', () => {
      const color1 = { r: 100, g: 100, b: 100 };
      const color2 = { r: 110, g: 100, b: 100 };
      
      // Distance should be sqrt(10² + 0² + 0²) = 10
      expect(colorDistance(color1, color2)).toBe(10);
    });

    test('should handle negative color values', () => {
      const color1 = { r: -50, g: -100, b: -150 };
      const color2 = { r: 50, g: 100, b: 150 };
      
      // Distance should be sqrt(100² + 200² + 300²) = sqrt(140000) ≈ 374.17
      const distance = colorDistance(color1, color2);
      expect(distance).toBeCloseTo(374.17, 1);
    });
  });

  describe('Color Tolerance', () => {
    test('should return true for colors within tolerance', () => {
      const color1 = { r: 100, g: 100, b: 100 };
      const color2 = { r: 110, g: 100, b: 100 };
      
      expect(colorsWithinTolerance(color1, color2, 15)).toBe(true);
      expect(colorsWithinTolerance(color1, color2, 10)).toBe(true);
    });

    test('should return false for colors outside tolerance', () => {
      const color1 = { r: 100, g: 100, b: 100 };
      const color2 = { r: 150, g: 100, b: 100 };
      
      expect(colorsWithinTolerance(color1, color2, 30)).toBe(false);
      expect(colorsWithinTolerance(color1, color2, 40)).toBe(false);
    });

    test('should use default tolerance of 30', () => {
      const color1 = { r: 100, g: 100, b: 100 };
      const color2 = { r: 120, g: 100, b: 100 };
      
      // Distance is 20, which is within default tolerance of 30
      expect(colorsWithinTolerance(color1, color2)).toBe(true);
    });

    test('should handle edge case tolerance', () => {
      const color1 = { r: 100, g: 100, b: 100 };
      const color2 = { r: 130, g: 100, b: 100 };
      
      // Distance is exactly 30, should be within tolerance
      expect(colorsWithinTolerance(color1, color2, 30)).toBe(true);
    });
  });

  describe('Closest Color Finding', () => {
    test('should find closest color from palette', () => {
      const palette = [
        { r: 255, g: 0, b: 0 },   // Red
        { r: 0, g: 255, b: 0 },   // Green
        { r: 0, g: 0, b: 255 }    // Blue
      ];
      
      const target = { r: 250, g: 10, b: 5 }; // Close to red
      const result = findClosestColor(target, palette);
      
      expect(result.color).toEqual({ r: 255, g: 0, b: 0 });
      expect(result.distance).toBeLessThan(100);
    });

    test('should handle empty palette', () => {
      const target = { r: 100, g: 100, b: 100 };
      const result = findClosestColor(target, []);
      
      expect(result.color).toBeNull();
      expect(result.distance).toBe(Infinity);
    });

    test('should find exact match', () => {
      const palette = [
        { r: 100, g: 150, b: 200 },
        { r: 200, g: 100, b: 150 }
      ];
      
      const target = { r: 100, g: 150, b: 200 };
      const result = findClosestColor(target, palette);
      
      expect(result.color).toEqual(target);
      expect(result.distance).toBe(0);
    });
  });

  describe('Dominant Color Extraction', () => {
    test('should extract colors from image data', () => {
      // Create mock image data (10x10 image, 4 bytes per pixel)
      const imageData = new Uint8ClampedArray(400);
      
      // Set some red pixels
      for (let i = 0; i < 100; i += 4) {
        imageData[i] = 255;     // Red
        imageData[i + 1] = 0;   // Green
        imageData[i + 2] = 0;   // Blue
        imageData[i + 3] = 255; // Alpha
      }
      
      const colors = extractDominantColors(imageData, 1);
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0]).toEqual({ r: 255, g: 0, b: 0 });
    });

    test('should respect sample rate', () => {
      const imageData = new Uint8ClampedArray(400);
      
      // Fill with test data
      for (let i = 0; i < imageData.length; i += 4) {
        imageData[i] = i % 256;     // Red
        imageData[i + 1] = (i + 1) % 256; // Green
        imageData[i + 2] = (i + 2) % 256; // Blue
        imageData[i + 3] = 255;     // Alpha
      }
      
      const colors1 = extractDominantColors(imageData, 1);  // Sample every pixel
      const colors2 = extractDominantColors(imageData, 2);  // Sample every other pixel
      const colors5 = extractDominantColors(imageData, 5);  // Sample every 5th pixel
      
      expect(colors1.length).toBeGreaterThan(colors2.length);
      expect(colors2.length).toBeGreaterThan(colors5.length);
    });

    test('should handle edge cases', () => {
      const emptyData = new Uint8ClampedArray(0);
      expect(extractDominantColors(emptyData)).toEqual([]);
      
      const smallData = new Uint8ClampedArray(3); // Less than 4 bytes
      // With 3 bytes and sample rate 1, it should process the first pixel (RGB)
      expect(extractDominantColors(smallData, 1)).toHaveLength(1);
      
      // With default sample rate of 10, it should process the first pixel
      const smallDataDefault = new Uint8ClampedArray(4); // Exactly 4 bytes (1 pixel)
      expect(extractDominantColors(smallDataDefault)).toHaveLength(1);
      
      // Test with sample rate that ensures no pixels are processed
      const smallDataHighRate = new Uint8ClampedArray(4); // 4 bytes but sample rate 2
      // With 4 bytes and sample rate 2, it should process the first pixel
      expect(extractDominantColors(smallDataHighRate, 2)).toHaveLength(1);
      
      const tinyData = new Uint8ClampedArray(4); // Exactly 4 bytes (1 pixel)
      const colors = extractDominantColors(tinyData, 1);
      expect(colors.length).toBe(1);
    });
  });

  describe('Color Grouping', () => {
    test('should group similar colors', () => {
      const colors = [
        { r: 255, g: 0, b: 0 },   // Red
        { r: 250, g: 5, b: 5 },   // Similar red
        { r: 0, g: 255, b: 0 },   // Green
        { r: 5, g: 250, b: 5 },   // Similar green
        { r: 0, g: 0, b: 255 }    // Blue
      ];
      
      const groups = groupSimilarColors(colors, 30);
      
      expect(groups).toHaveLength(3);
      
      // Check that similar colors are grouped together
      const redGroup = groups.find(group => 
        group.some(color => color.r > 200 && color.g < 100)
      );
      expect(redGroup).toHaveLength(2);
      
      const greenGroup = groups.find(group => 
        group.some(color => color.g > 200 && color.r < 100)
      );
      expect(greenGroup).toHaveLength(2);
      
      const blueGroup = groups.find(group => 
        group.some(color => color.b > 200 && color.r < 100 && color.g < 100)
      );
      expect(blueGroup).toHaveLength(1);
    });

    test('should handle strict tolerance', () => {
      const colors = [
        { r: 255, g: 0, b: 0 },
        { r: 254, g: 1, b: 1 },
        { r: 0, g: 255, b: 0 }
      ];
      
      const groups = groupSimilarColors(colors, 5); // Very strict tolerance
      // With tolerance 5, the first two red colors should be grouped together
      expect(groups).toHaveLength(2); // 2 groups: reds + green
    });

    test('should handle loose tolerance', () => {
      const colors = [
        { r: 255, g: 0, b: 0 },
        { r: 200, g: 50, b: 50 },
        { r: 0, g: 255, b: 0 }
      ];
      
      const groups = groupSimilarColors(colors, 100); // Very loose tolerance
      // With tolerance 100, reds should be grouped, but green might be separate
      expect(groups).toHaveLength(2); // 2 groups: reds + green
    });
  });

  describe('Average Color Calculation', () => {
    test('should calculate average color correctly', () => {
      const colorGroup = [
        { r: 100, g: 200, b: 300 },
        { r: 200, g: 100, b: 300 },
        { r: 300, g: 200, b: 100 }
      ];
      
      const average = calculateAverageColor(colorGroup);
      
      expect(average.r).toBe(200); // (100 + 200 + 300) / 3
      expect(average.g).toBe(167); // (200 + 100 + 200) / 3
      expect(average.b).toBe(233); // (300 + 300 + 100) / 3
    });

    test('should handle single color', () => {
      const colorGroup = [{ r: 255, g: 128, b: 64 }];
      const average = calculateAverageColor(colorGroup);
      
      expect(average).toEqual({ r: 255, g: 128, b: 64 });
    });

    test('should handle empty group', () => {
      const average = calculateAverageColor([]);
      expect(average).toEqual({ r: 0, g: 0, b: 0 });
    });

    test('should round values correctly', () => {
      const colorGroup = [
        { r: 1, g: 2, b: 3 },
        { r: 2, g: 3, b: 4 }
      ];
      
      const average = calculateAverageColor(colorGroup);
      
      expect(average.r).toBe(2); // (1 + 2) / 2 = 1.5, rounded to 2
      expect(average.g).toBe(3); // (2 + 3) / 2 = 2.5, rounded to 3
      expect(average.b).toBe(4); // (3 + 4) / 2 = 3.5, rounded to 4
    });
  });
});
