const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests', () => {
  test('app loads successfully', async ({ page }) => {
    // Navigate and wait for network to be idle  
    // Note: no leading slash so it's relative to baseURL
    await page.goto('index.html', { waitUntil: 'networkidle' });
    
    // Log the current URL and page title for debugging
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check that the main heading is visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Directed Color Picker');
    
    // Check that main UI elements are present
    await expect(page.locator('#run-button')).toBeVisible();
    await expect(page.locator('#dropzone')).toBeVisible();
    await expect(page.locator('#image-container')).toBeVisible();
    await expect(page.locator('#pallet')).toBeVisible();
  });

  test('controls are interactive', async ({ page }) => {
    await page.goto('index.html');
    
    // Check iteration input
    const iterationInput = page.locator('#iterations');
    await expect(iterationInput).toBeVisible();
    await expect(iterationInput).toHaveValue('4');
    
    // Check palette size input
    const paletteSizeInput = page.locator('#pallet-size');
    await expect(paletteSizeInput).toBeVisible();
    await expect(paletteSizeInput).toHaveValue('20');
    
    // Check run button is clickable (but don't click it without an image)
    const runButton = page.locator('#run-button');
    await expect(runButton).toBeEnabled();
  });

  test('worker loads successfully', async ({ page }) => {
    // Listen for console logs to verify worker is loaded
    const workerMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Worker:') || text.includes('WorkBoots')) {
        workerMessages.push(text);
      }
    });
    
    await page.goto('index.html');
    
    // Wait a bit for worker to load
    await page.waitForTimeout(2000);
    
    // Verify worker loaded
    console.log('Worker messages:', workerMessages);
    expect(workerMessages.length).toBeGreaterThan(0);
    
    // Verify worker is ready
    const workerReady = workerMessages.some(msg => 
      msg.includes('Socks instance created') || 
      msg.includes('socks loaded')
    );
    expect(workerReady).toBe(true);
  });

  test('file upload triggers image processing', async ({ page }) => {
    const path = require('path');
    const testImagePath = path.join(__dirname, '..', 'src', 'test', 'usa.png');
    
    await page.goto('index.html');
    
    // Upload an image
    const fileInput = page.locator('input.file-upload');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for canvas to appear with the image
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    // Verify image container has the "has-image" class
    const imageContainer = page.locator('#image-container');
    await expect(imageContainer).toHaveClass(/has-image/);
  });
});

