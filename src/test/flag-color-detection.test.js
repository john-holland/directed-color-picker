import colorMap from './color_map.json';
import {
  colorDistance,
  colorsWithinTolerance,
  findClosestColor,
  groupSimilarColors,
  calculateAverageColor
} from './image-utils.js';

describe('Flag Color Detection Tests', () => {
  describe('Color Map Validation', () => {
    test('should have valid color map structure', () => {
      expect(colorMap).toBeDefined();
      expect(colorMap.countries).toBeDefined();
      expect(typeof colorMap.countries).toBe('object');
    });

    test('should have all expected countries', () => {
      const expectedCountries = ['china', 'england', 'france', 'india', 'italy', 'russia', 'usa'];
      const actualCountries = Object.keys(colorMap.countries);
      
      expect(actualCountries).toEqual(expect.arrayContaining(expectedCountries));
    });

    test('should have valid color data for each country', () => {
      Object.entries(colorMap.countries).forEach(([country, data]) => {
        expect(data.colors).toBeDefined();
        expect(Array.isArray(data.colors)).toBe(true);
        expect(data.colors.length).toBeGreaterThan(0);
        expect(data.image).toBeDefined();
        expect(typeof data.image).toBe('string');
        
        // Validate each color has r, g, b properties
        data.colors.forEach(color => {
          expect(color.r).toBeDefined();
          expect(color.g).toBeDefined();
          expect(color.b).toBeDefined();
          expect(typeof color.r).toBe('number');
          expect(typeof color.g).toBe('number');
          expect(typeof color.b).toBe('number');
          expect(color.r).toBeGreaterThanOrEqual(0);
          expect(color.g).toBeGreaterThanOrEqual(0);
          expect(color.b).toBeGreaterThanOrEqual(0);
          expect(color.r).toBeLessThanOrEqual(255);
          expect(color.g).toBeLessThanOrEqual(255);
          expect(color.b).toBeLessThanOrEqual(255);
        });
      });
    });
  });

  describe('China Flag Colors', () => {
    const chinaColors = colorMap.countries.china.colors;
    
    test('should have correct number of colors', () => {
      expect(chinaColors).toHaveLength(2); // Red and yellow
    });

    test('should have red color within expected range', () => {
      const redColor = chinaColors.find(color => color.r > 200 && color.g < 100);
      expect(redColor).toBeDefined();
      expect(redColor.r).toBeGreaterThan(200);
      expect(redColor.g).toBeLessThan(100);
      expect(redColor.b).toBeLessThan(100);
    });

    test('should have yellow color within expected range', () => {
      const yellowColor = chinaColors.find(color => color.r > 200 && color.g > 200 && color.b < 100);
      expect(yellowColor).toBeDefined();
      expect(yellowColor.r).toBeGreaterThan(200);
      expect(yellowColor.g).toBeGreaterThan(200);
      expect(yellowColor.b).toBeLessThan(100);
    });

    test('should detect similar colors within tolerance', () => {
      const detectedRed = { r: 200, g: 65, b: 40 };
      const detectedYellow = { r: 245, g: 220, b: 80 };
      
      const redMatch = chinaColors.some(expected => 
        colorsWithinTolerance(detectedRed, expected, 50)
      );
      const yellowMatch = chinaColors.some(expected => 
        colorsWithinTolerance(detectedYellow, expected, 50)
      );
      
      expect(redMatch).toBe(true);
      expect(yellowMatch).toBe(true);
    });
  });

  describe('France Flag Colors', () => {
    const franceColors = colorMap.countries.france.colors;
    
    test('should have correct number of colors', () => {
      expect(franceColors).toHaveLength(3); // Blue, white, red
    });

    test('should have blue color within expected range', () => {
      const blueColor = franceColors.find(color => color.b > 100 && color.r < 100 && color.g < 100);
      expect(blueColor).toBeDefined();
      expect(blueColor.b).toBeGreaterThan(100);
      expect(blueColor.r).toBeLessThan(100);
      expect(blueColor.g).toBeLessThan(100);
    });

    test('should have white color within expected range', () => {
      const whiteColor = franceColors.find(color => 
        color.r > 250 && color.g > 250 && color.b > 250
      );
      expect(whiteColor).toBeDefined();
      expect(whiteColor.r).toBeGreaterThan(250);
      expect(whiteColor.g).toBeGreaterThan(250);
      expect(whiteColor.b).toBeGreaterThan(250);
    });

    test('should have red color within expected range', () => {
      const redColor = franceColors.find(color => color.r > 200 && color.g < 100 && color.b < 100);
      expect(redColor).toBeDefined();
      expect(redColor.r).toBeGreaterThan(200);
      expect(redColor.g).toBeLessThan(100);
      expect(redColor.b).toBeLessThan(100);
    });
  });

  describe('USA Flag Colors', () => {
    const usaColors = colorMap.countries.usa.colors;
    
    test('should have correct number of colors', () => {
      expect(usaColors).toHaveLength(3); // Red, white, blue
    });

    test('should have red color within expected range', () => {
      const redColor = usaColors.find(color => color.r > 150 && color.g < 100 && color.b < 100);
      expect(redColor).toBeDefined();
      expect(redColor.r).toBeGreaterThan(150);
      expect(redColor.g).toBeLessThan(100);
      expect(redColor.b).toBeLessThan(100);
    });

    test('should have white color within expected range', () => {
      const whiteColor = usaColors.find(color => 
        color.r > 250 && color.g > 250 && color.b > 250
      );
      expect(whiteColor).toBeDefined();
      expect(whiteColor.r).toBeGreaterThan(250);
      expect(whiteColor.g).toBeGreaterThan(250);
      expect(whiteColor.b).toBeGreaterThan(250);
    });

    test('should have blue color within expected range', () => {
      const blueColor = usaColors.find(color => color.b > 100 && color.r < 100 && color.g < 100);
      expect(blueColor).toBeDefined();
      expect(blueColor.b).toBeGreaterThan(100);
      expect(blueColor.r).toBeLessThan(100);
      expect(blueColor.g).toBeLessThan(100);
    });
  });

  describe('Color Tolerance Testing', () => {
    test('should detect colors within various tolerance levels', () => {
      const franceColors = colorMap.countries.france.colors;
      const detectedBlue = { r: 15, g: 39, b: 148 }; // Close to France blue
      
      // Test different tolerance levels
      expect(colorsWithinTolerance(detectedBlue, franceColors[0], 5)).toBe(false);  // Too strict
      expect(colorsWithinTolerance(detectedBlue, franceColors[0], 20)).toBe(true);  // Just right
      expect(colorsWithinTolerance(detectedBlue, franceColors[0], 50)).toBe(true);  // Very loose
    });

    test('should handle edge cases in tolerance', () => {
      const color1 = { r: 100, g: 100, b: 100 };
      const color2 = { r: 130, g: 100, b: 100 };
      
      // Distance is exactly 30
      expect(colorsWithinTolerance(color1, color2, 29)).toBe(false);
      expect(colorsWithinTolerance(color1, color2, 30)).toBe(true);
      expect(colorsWithinTolerance(color1, color2, 31)).toBe(true);
    });
  });

  describe('Multi-Country Color Analysis', () => {
    test('should find common colors across flags', () => {
      const allColors = [];
      Object.values(colorMap.countries).forEach(country => {
        allColors.push(...country.colors);
      });
      
      // Group similar colors across all flags
      const colorGroups = groupSimilarColors(allColors, 50);
      
      // Should have multiple groups (not all colors grouped together)
      expect(colorGroups.length).toBeGreaterThan(1);
      expect(colorGroups.length).toBeLessThan(allColors.length);
      
      // Check that white colors are grouped together
      const whiteGroup = colorGroups.find(group => 
        group.some(color => color.r > 250 && color.g > 250 && color.b > 250)
      );
      expect(whiteGroup).toBeDefined();
      expect(whiteGroup.length).toBeGreaterThan(1); // Multiple countries have white
    });

    test('should calculate average colors for each country', () => {
      Object.entries(colorMap.countries).forEach(([country, data]) => {
        const averageColor = calculateAverageColor(data.colors);
        
        expect(averageColor).toBeDefined();
        expect(typeof averageColor.r).toBe('number');
        expect(typeof averageColor.g).toBe('number');
        expect(typeof averageColor.b).toBe('number');
        
        // Average should be within reasonable bounds
        expect(averageColor.r).toBeGreaterThanOrEqual(0);
        expect(averageColor.g).toBeGreaterThanOrEqual(0);
        expect(averageColor.b).toBeGreaterThanOrEqual(0);
        expect(averageColor.r).toBeLessThanOrEqual(255);
        expect(averageColor.g).toBeLessThanOrEqual(255);
        expect(averageColor.b).toBeLessThanOrEqual(255);
      });
    });
  });

  describe('Color Distance Analysis', () => {
    test('should calculate distances between flag colors', () => {
      const chinaRed = colorMap.countries.china.colors[0];
      const franceRed = colorMap.countries.france.colors[2];
      const usaRed = colorMap.countries.usa.colors[0];
      
      // Calculate distances between red colors from different flags
      const chinaFranceDistance = colorDistance(chinaRed, franceRed);
      const chinaUsaDistance = colorDistance(chinaRed, usaRed);
      const franceUsaDistance = colorDistance(franceRed, usaRed);
      
      expect(chinaFranceDistance).toBeGreaterThan(0);
      expect(chinaUsaDistance).toBeGreaterThan(0);
      expect(franceUsaDistance).toBeGreaterThan(0);
      
      // All should be reasonable distances (not extremely close or far)
      expect(chinaFranceDistance).toBeLessThan(300);
      expect(chinaUsaDistance).toBeLessThan(300);
      expect(franceUsaDistance).toBeLessThan(300);
    });

    test('should find closest colors between countries', () => {
      const chinaYellow = colorMap.countries.china.colors[1];
      const allColors = [];
      Object.values(colorMap.countries).forEach(country => {
        country.colors.forEach(color => {
          if (color !== chinaYellow) { // Exclude the target color
            allColors.push(color);
          }
        });
      });
      
      const closest = findClosestColor(chinaYellow, allColors);
      
      expect(closest.color).toBeDefined();
      expect(closest.distance).toBeGreaterThan(0);
      expect(closest.distance).toBeLessThan(Infinity);
    });
  });

  describe('Flag Color Uniqueness', () => {
    test('should have distinct color palettes for different countries', () => {
      const countries = Object.keys(colorMap.countries);
      
      for (let i = 0; i < countries.length; i++) {
        for (let j = i + 1; j < countries.length; j++) {
          const country1 = colorMap.countries[countries[i]];
          const country2 = colorMap.countries[countries[j]];
          
          // Calculate average distance between color palettes
          let totalDistance = 0;
          let comparisonCount = 0;
          
          country1.colors.forEach(color1 => {
            country2.colors.forEach(color2 => {
              totalDistance += colorDistance(color1, color2);
              comparisonCount++;
            });
          });
          
          const averageDistance = totalDistance / comparisonCount;
          
          // Different countries should have reasonably different color palettes
          expect(averageDistance).toBeGreaterThan(50);
        }
      }
    });
  });
});
