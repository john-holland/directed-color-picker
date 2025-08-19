import { clusterMaker } from '../algorithms/k-means-clustering.js';

describe('K-Means Clustering Tests', () => {
  describe('Basic K-Means Functionality', () => {
    test('should handle basic clustering setup', () => {
      // Test the ClusterMaker configuration without running the full algorithm
      clusterMaker.k(3);
      clusterMaker.iterations(10);
      
      expect(clusterMaker.k()).toBe(3);
      expect(clusterMaker.iterations()).toBe(10);
    });

    test('should validate k value constraints', () => {
      // Test that invalid k values are rejected
      const originalK = clusterMaker.k();
      
      clusterMaker.k(0); // Invalid: must be positive
      expect(clusterMaker.k()).toBe(originalK);
      
      clusterMaker.k(3.5); // Invalid: must be integer
      expect(clusterMaker.k()).toBe(originalK);
      
      clusterMaker.k(5); // Valid
      expect(clusterMaker.k()).toBe(5);
    });

    test('should validate iterations constraints', () => {
      // Test that invalid iteration values are rejected
      const originalIterations = clusterMaker.iterations();
      
      clusterMaker.iterations(0); // Invalid: must be positive
      expect(clusterMaker.iterations()).toBe(originalIterations);
      
      clusterMaker.iterations(3.5); // Invalid: must be integer
      expect(clusterMaker.iterations()).toBe(originalIterations);
      
      clusterMaker.iterations(100); // Valid
      expect(clusterMaker.iterations()).toBe(100);
    });
  });

  describe('Color Clustering Tests', () => {
    test('should validate color data format', () => {
      const validData = [
        [255, 0, 0], [0, 255, 0], [0, 0, 255]
      ];
      
      clusterMaker.data(validData);
      expect(clusterMaker.data()).toEqual(validData);
    });

    test('should reject invalid color data format', () => {
      const validData = [[255, 0, 0], [0, 255, 0]];
      clusterMaker.data(validData);
      
      const invalidData = [[255, 0], [0, 255, 0, 0]]; // Different lengths
      clusterMaker.data(invalidData);
      
      // Should keep the previous valid data
      expect(clusterMaker.data()).toEqual(validData);
    });

    test('should handle RGB color validation', () => {
      const rgbColors = [
        [255, 0, 0],   // Red
        [0, 255, 0],   // Green
        [0, 0, 255]    // Blue
      ];
      
      clusterMaker.data(rgbColors);
      expect(clusterMaker.data()).toEqual(rgbColors);
      
      // Each color should have exactly 3 components
      clusterMaker.data().forEach(color => {
        expect(color).toHaveLength(3);
        color.forEach(component => {
          expect(typeof component).toBe('number');
          expect(component).toBeGreaterThanOrEqual(0);
          expect(component).toBeLessThanOrEqual(255);
        });
      });
    });
  });

  describe('ClusterMaker Tests', () => {
    test('should set and validate k value', () => {
      clusterMaker.k(5);
      expect(clusterMaker.k()).toBe(5);
      
      // Invalid k values should not be set
      clusterMaker.k(0);
      expect(clusterMaker.k()).toBe(5); // Should remain unchanged
      
      clusterMaker.k(3.5);
      expect(clusterMaker.k()).toBe(5); // Should remain unchanged
    });

    test('should set and validate iterations', () => {
      clusterMaker.iterations(100);
      expect(clusterMaker.iterations()).toBe(100);
      
      // Invalid iterations should not be set
      clusterMaker.iterations(0);
      expect(clusterMaker.iterations()).toBe(100); // Should remain unchanged
      
      clusterMaker.iterations(3.5);
      expect(clusterMaker.iterations()).toBe(100); // Should remain unchanged
    });

    test('should validate data format', () => {
      const validData = [[1, 2], [3, 4], [5, 6]];
      clusterMaker.data(validData);
      expect(clusterMaker.data()).toEqual(validData);
      
      // Invalid data (different lengths) should not be set
      const invalidData = [[1, 2], [3, 4, 5], [6, 7]];
      clusterMaker.data(invalidData);
      expect(clusterMaker.data()).toEqual(validData); // Should remain unchanged
    });
  });

  describe('ClusterMaker Integration', () => {
    test('should configure clustering parameters', () => {
      clusterMaker.k(4);
      clusterMaker.iterations(50);
      
      expect(clusterMaker.k()).toBe(4);
      expect(clusterMaker.iterations()).toBe(50);
    });

    test('should handle data validation', () => {
      const testData = [
        [100, 150, 200],
        [200, 100, 150],
        [150, 200, 100]
      ];
      
      clusterMaker.data(testData);
      expect(clusterMaker.data()).toEqual(testData);
    });
  });
});
