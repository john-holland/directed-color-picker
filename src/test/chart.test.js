import { generateChart, createGraph } from '../chart.js';

describe('Chart Initialization Tests', () => {
  describe('createGraph', () => {
    test('should create graph with empty nodes array', () => {
      const graph = createGraph();
      
      expect(graph).toBeDefined();
      expect(graph.nodes).toEqual([]);
      expect(graph.links).toEqual([]);
    });

    test('should create graph with single node', () => {
      const testNode = { x: 100, y: 200, color: '#ff0000' };
      const graph = createGraph([testNode]);
      
      expect(graph.nodes).toHaveLength(2); // colorNode + positionNode
      expect(graph.links).toHaveLength(1);
      
      // Check color node
      const colorNode = graph.nodes[0];
      expect(colorNode.index).toBe(0);
      expect(colorNode.x).toBe(150); // 100 + 50
      expect(colorNode.y).toBe(250); // 200 + 50
      expect(colorNode.color).toBe('#ff0000');
      expect(typeof colorNode.vx).toBe('number');
      expect(typeof colorNode.vy).toBe('number');
      
      // Check position node
      const positionNode = graph.nodes[1];
      expect(positionNode.index).toBe(0);
      expect(positionNode.x).toBe(100);
      expect(positionNode.y).toBe(200);
      expect(positionNode.color).toBeUndefined();
      expect(positionNode.vx).toBe(0);
      expect(positionNode.vy).toBe(0);
      
      // Check link
      const link = graph.links[0];
      expect(link.source).toBe(positionNode);
      expect(link.target).toBe(colorNode);
      expect(link.index).toBe(0);
    });

    test('should create graph with multiple nodes', () => {
      const testNodes = [
        { x: 0, y: 0, color: '#ff0000' },
        { x: 100, y: 100, color: '#00ff00' },
        { x: 200, y: 200, color: '#0000ff' }
      ];
      
      const graph = createGraph(testNodes);
      
      expect(graph.nodes).toHaveLength(6); // 3 colorNodes + 3 positionNodes
      expect(graph.links).toHaveLength(3);
      
      // Check all nodes have correct indices
      for (let i = 0; i < testNodes.length; i++) {
        const colorNode = graph.nodes[i * 2];
        const positionNode = graph.nodes[i * 2 + 1];
        
        expect(colorNode.index).toBe(i);
        expect(positionNode.index).toBe(i);
        expect(colorNode.color).toBe(testNodes[i].color);
        expect(positionNode.color).toBeUndefined();
      }
    });

    test('should handle nodes with undefined coordinates', () => {
      const testNode = { x: undefined, y: undefined, color: '#ff0000' };
      const graph = createGraph([testNode]);
      
      expect(graph.nodes[0].x).toBeNaN(); // undefined + 50 = NaN
      expect(graph.nodes[0].y).toBeNaN(); // undefined + 50 = NaN
      expect(graph.nodes[1].x).toBeUndefined();
      expect(graph.nodes[1].y).toBeUndefined();
    });
  });

  describe('generateChart', () => {
    test('should generate chart with basic dimensions', () => {
      const width = 800;
      const height = 600;
      const testNodes = [{ x: 100, y: 100, color: '#ff0000' }];
      const graph = createGraph(testNodes);
      
      const chart = generateChart(width, height, graph);
      
      expect(chart).toBeDefined();
      expect(chart.svg).toBeDefined();
      expect(chart.simulation).toBeDefined();
      expect(typeof chart.scaleColorNode).toBe('function');
      expect(typeof chart.resetColorNode).toBe('function');
    });

    test('should handle empty graph', () => {
      const width = 400;
      const height = 300;
      const emptyGraph = { nodes: [], links: [] };
      
      const chart = generateChart(width, height, emptyGraph);
      
      expect(chart).toBeDefined();
      expect(chart.svg).toBeDefined();
      expect(chart.simulation).toBeDefined();
    });

    test('should handle large dimensions', () => {
      const width = 1920;
      const height = 1080;
      const testNodes = [{ x: 500, y: 500, color: '#ff0000' }];
      const graph = createGraph(testNodes);
      
      const chart = generateChart(width, height, graph);
      
      expect(chart).toBeDefined();
      expect(chart.svg).toBeDefined();
    });
  });

  describe('Graph Structure Validation', () => {
    test('should maintain node-link relationships', () => {
      const testNodes = [
        { x: 0, y: 0, color: '#ff0000' },
        { x: 100, y: 100, color: '#00ff00' }
      ];
      
      const graph = createGraph(testNodes);
      
      // Verify each link connects correct nodes
      graph.links.forEach((link, index) => {
        const expectedSource = graph.nodes[index * 2 + 1]; // positionNode
        const expectedTarget = graph.nodes[index * 2]; // colorNode
        
        expect(link.source).toBe(expectedSource);
        expect(link.target).toBe(expectedTarget);
        expect(link.index).toBe(index);
      });
    });

    test('should handle nodes with various color formats', () => {
      const testNodes = [
        { x: 0, y: 0, color: '#ff0000' },
        { x: 100, y: 100, color: 'rgb(0, 255, 0)' },
        { x: 200, y: 200, color: 'blue' },
        { x: 300, y: 300, color: null },
        { x: 400, y: 400, color: undefined }
      ];
      
      const graph = createGraph(testNodes);
      
      expect(graph.nodes).toHaveLength(10); // 5 colorNodes + 5 positionNodes
      
      // Check that color values are preserved
      for (let i = 0; i < testNodes.length; i++) {
        const colorNode = graph.nodes[i * 2];
        expect(colorNode.color).toBe(testNodes[i].color);
      }
    });
  });
});

