const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Progressive Color Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (no leading slash to use baseURL)
    await page.goto('index.html');
    
    // Wait for the app to be ready
    await expect(page.locator('h1')).toContainText('Directed Color Picker');
  });

  test('should show processing nodes during quad processing', async ({ page }) => {
    // Use a test image from the src/test directory
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'usa.png');
    
    // Upload the image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for the image to be processed and canvas to be created
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Click the Run Analysis button
    await page.click('#run-button');
    
    // Wait for loading to show
    await expect(page.locator('#loading')).toHaveClass(/show/);
    
    // Track the processing status messages
    const statusMessages = [];
    
    // Set up a listener for processing status updates
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('📊 Sending') || text.includes('processing colors')) {
        statusMessages.push(text);
      }
    });
    
    // Wait for the first processing palette message
    await page.waitForFunction(() => {
      const svg = document.querySelector('svg');
      return svg && svg.querySelectorAll('.node').length > 0;
    }, { timeout: 30000 });
    
    // Check that processing nodes are visible (with green dashed stroke)
    const processingNodes = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('svg .node'));
      return nodes.filter(node => {
        const stroke = window.getComputedStyle(node).stroke;
        const strokeDasharray = window.getComputedStyle(node).strokeDasharray;
        // Processing nodes have green stroke or dashed stroke
        return strokeDasharray && strokeDasharray !== 'none';
      }).length;
    });
    
    console.log(`Found ${processingNodes} processing nodes during quad processing`);
    expect(processingNodes).toBeGreaterThan(0);
    
    // Wait for completion
    await expect(page.locator('#loading')).not.toHaveClass(/show/, { timeout: 60000 });
  });

  test('should populate final palette with color squares', async ({ page }) => {
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'france.png');
    
    // Upload the image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for the image to be processed
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Click the Run Analysis button
    await page.click('#run-button');
    
    // Wait for completion (loading indicator disappears)
    await expect(page.locator('#loading')).not.toHaveClass(/show/, { timeout: 60000 });
    
    // Check that the palette has color squares
    const paletteColors = page.locator('#pallet > div');
    const colorCount = await paletteColors.count();
    
    console.log(`Found ${colorCount} colors in final palette`);
    expect(colorCount).toBeGreaterThan(0);
    
    // Verify each color square has a background color set
    for (let i = 0; i < Math.min(colorCount, 5); i++) {
      const color = await paletteColors.nth(i);
      const bgColor = await color.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(bgColor).not.toBe('transparent');
    }
  });

  test('should show D3 nodes in SVG overlay', async ({ page }) => {
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'england.png');
    
    // Upload the image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for the image to be processed
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Click the Run Analysis button
    await page.click('#run-button');
    
    // Wait for completion
    await expect(page.locator('#loading')).not.toHaveClass(/show/, { timeout: 60000 });
    
    // Verify SVG exists and has nodes
    await expect(page.locator('svg')).toBeVisible();
    
    const nodeCount = await page.locator('svg .node').count();
    console.log(`Found ${nodeCount} D3 nodes in SVG`);
    expect(nodeCount).toBeGreaterThan(0);
    
    // Verify nodes have proper attributes
    const firstNode = page.locator('svg .node').first();
    await expect(firstNode).toHaveAttribute('r');
    await expect(firstNode).toHaveAttribute('cx');
    await expect(firstNode).toHaveAttribute('cy');
    
    // Check that color nodes have fill colors
    const colorNodesWithFill = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('svg .node'));
      return nodes.filter(node => {
        const fill = window.getComputedStyle(node).fill;
        return fill && fill !== 'rgb(51, 51, 51)' && fill !== '#333';
      }).length;
    });
    
    console.log(`Found ${colorNodesWithFill} color nodes with custom fill`);
    expect(colorNodesWithFill).toBeGreaterThan(0);
  });

  test('should show progress updates during processing', async ({ page }) => {
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'italy.png');
    
    // Upload the image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for the image to be processed
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Click the Run Analysis button
    await page.click('#run-button');
    
    // Wait for loading to show
    await expect(page.locator('#loading')).toHaveClass(/show/);
    
    // Check that progress bar starts at 0%
    const progressBar = page.locator('#progress-bar');
    let initialWidth = await progressBar.evaluate(el => el.style.width);
    expect(initialWidth).toBe('0%');
    
    // Wait for progress to increase
    await page.waitForFunction(() => {
      const bar = document.querySelector('#progress-bar');
      return bar && bar.style.width !== '0%';
    }, { timeout: 30000 });
    
    // Check progress status messages appear
    const statusElement = page.locator('#processing-status');
    await expect(statusElement).not.toBeEmpty();
    
    const statusText = await statusElement.textContent();
    console.log(`Processing status: ${statusText}`);
    expect(statusText).toBeTruthy();
    
    // Wait for completion
    await expect(page.locator('#loading')).not.toHaveClass(/show/, { timeout: 60000 });
    
    // Final progress should be 100% or loading hidden
    const finalWidth = await progressBar.evaluate(el => el.style.width);
    console.log(`Final progress: ${finalWidth}`);
  });

  test('should receive processing palette updates for each quad level', async ({ page }) => {
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'china.png');
    
    // Collect console messages about processing palettes
    const processingUpdates = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('📥 Received processing palette') || 
          text.includes('Processing palette updated') ||
          text.includes('📊 Sending') && text.includes('processing colors')) {
        processingUpdates.push(text);
      }
    });
    
    // Upload the image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for the image to be processed
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Click the Run Analysis button
    await page.click('#run-button');
    
    // Wait for completion
    await expect(page.locator('#loading')).not.toHaveClass(/show/, { timeout: 60000 });
    
    // Verify we got multiple processing palette updates (one for each quad level)
    console.log(`Received ${processingUpdates.length} processing palette updates`);
    console.log('Updates:', processingUpdates);
    
    // We should have at least 3-4 updates for different quad levels (8x8, 6x6, 4x4, 2x2, 1x1)
    expect(processingUpdates.length).toBeGreaterThanOrEqual(3);
  });

  test('should remove processing nodes before showing final nodes', async ({ page }) => {
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'russia.png');
    
    // Track node removals
    const nodeEvents = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🧹 Removing') || text.includes('processing nodes')) {
        nodeEvents.push(text);
      }
    });
    
    // Upload the image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for the image to be processed
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Click the Run Analysis button
    await page.click('#run-button');
    
    // Wait for completion
    await expect(page.locator('#loading')).not.toHaveClass(/show/, { timeout: 60000 });
    
    // Verify that processing nodes were removed
    console.log(`Node removal events: ${nodeEvents.length}`);
    console.log('Events:', nodeEvents);
    
    // Should have multiple removal events as each level replaces the previous
    expect(nodeEvents.length).toBeGreaterThan(0);
    
    // Verify no processing nodes remain (no nodes with isProcessing flag)
    const remainingProcessingNodes = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      if (!svg) return 0;
      
      // Check D3 data for isProcessing flag
      const nodes = Array.from(svg.querySelectorAll('.node'));
      return nodes.filter(node => {
        const strokeDasharray = window.getComputedStyle(node).strokeDasharray;
        // Processing nodes have dashed strokes
        return strokeDasharray && strokeDasharray !== 'none' && strokeDasharray !== '';
      }).length;
    });
    
    console.log(`Remaining processing nodes: ${remainingProcessingNodes}`);
    // Final nodes should not have processing styling
    expect(remainingProcessingNodes).toBe(0);
  });
});

