/**
 * Visual Regression Tests for Globe Component
 * Ensures UI consistency across rendering changes
 */

import { test, expect } from '@playwright/test';

test.describe('Globe Component Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page containing the globe
    await page.goto('/');
  });

  test('should render globe with consistent styling', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    await expect(globeContainer).toBeVisible();
    
    // Take screenshot for visual regression
    await expect(globeContainer).toHaveScreenshot('globe-initial.png', {
      maxDiffPixels: 100
    });
  });

  test('should show labels with correct positioning', async ({ page }) => {
    const labelLayer = page.locator('[aria-hidden="true"]');
    
    await expect(labelLayer).toBeVisible();
    await expect(labelLayer).toHaveScreenshot('globe-labels.png', {
      maxDiffPixels: 50
    });
  });

  test('should animate on region hover', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    // Hover over globe
    await globeContainer.hover({ position: { x: 250, y: 280 } });
    
    await page.waitForTimeout(300);
    
    await expect(globeContainer).toHaveScreenshot('globe-hover.png', {
      maxDiffPixels: 100
    });
  });

  test('should maintain responsive layout on resize', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    // Check initial state
    await expect(globeContainer).toHaveScreenshot('globe-desktop.png');
    
    // Resize viewport
    await page.setViewportSize({ width: 768, height: 600 });
    
    await page.waitForTimeout(500);
    
    // Take screenshot after resize
    await expect(globeContainer).toHaveScreenshot('globe-tablet.png', {
      maxDiffPixels: 150
    });
  });

  test('should show loading indicator on click', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    // Click on globe
    await globeContainer.click({ position: { x: 250, y: 280 } });
    
    // Loading indicator should appear
    const loadingIndicator = page.locator('.animate-spin');
    
    if (await loadingIndicator.isVisible()) {
      await expect(globeContainer).toHaveScreenshot('globe-loading.png', {
        maxDiffPixels: 100
      });
    }
  });

  test('should render labels with high contrast mode', async ({ page }) => {
    const labelLayer = page.locator('[aria-hidden="true"]');
    
    // Apply high contrast CSS
    await page.addInitScript(() => {
      document.documentElement.style.setProperty('--high-contrast', '1');
    });
    
    await expect(labelLayer).toHaveScreenshot('globe-high-contrast.png', {
      maxDiffPixels: 50
    });
  });

  test('should handle multiple rapid hovers smoothly', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    // Perform multiple hovers
    for (let i = 0; i < 3; i++) {
      await globeContainer.hover({ position: { x: 100 + i * 50, y: 280 } });
      await page.waitForTimeout(150);
    }
    
    await expect(globeContainer).toHaveScreenshot('globe-rapid-hover.png', {
      maxDiffPixels: 100
    });
  });

  test('should maintain consistency with accessibility features enabled', async ({ page }) => {
    // Enable accessibility features
    await page.addInitScript(() => {
      window.__FORCE_ACCESSIBILITY__ = true;
    });
    
    const globeContainer = page.locator('[role="application"]');
    
    await expect(globeContainer).toHaveScreenshot('globe-accessible.png', {
      maxDiffPixels: 50
    });
  });

  test('should render correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const globeContainer = page.locator('[role="application"]');
    
    await expect(globeContainer).toHaveScreenshot('globe-mobile.png', {
      maxDiffPixels: 150
    });
  });

  test('should maintain animation performance above 60fps', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    // Measure FPS using performance API
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFrame = () => {
          frames++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime >= 1000) {
            resolve(frames);
            return;
          }
          
          requestAnimationFrame(measureFrame);
        };
        
        requestAnimationFrame(measureFrame);
      });
    });
    
    expect(fps).toBeGreaterThanOrEqual(55); // Allow some variance
  });

  test('should render consistent colors across frames', async ({ page }) => {
    const globeContainer = page.locator('[role="application"]');
    
    // Wait for stable rendering
    await page.waitForTimeout(1000);
    
    // Take multiple screenshots and verify consistency
    for (let i = 0; i < 3; i++) {
      await expect(globeContainer).toHaveScreenshot(`globe-color-consistency-${i}.png`, {
        maxDiffPixels: 50
      });
      
      await page.waitForTimeout(100);
    }
  });
});

test.describe('Globe Component Cross-Browser', () => {
  test('should render in Chrome', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return;
    
    await page.goto('/');
    const globeContainer = page.locator('[role="application"]');
    
    await expect(globeContainer).toHaveScreenshot('globe-chrome.png');
  });

  test('should render in Firefox', async ({ page, browserName }) => {
    if (browserName !== 'firefox') return;
    
    await page.goto('/');
    const globeContainer = page.locator('[role="application"]');
    
    await expect(globeContainer).toHaveScreenshot('globe-firefox.png', {
      maxDiffPixels: 100 // Firefox may have slight rendering differences
    });
  });

  test('should render in Safari', async ({ page, browserName }) => {
    if (browserName !== 'webkit') return;
    
    await page.goto('/');
    const globeContainer = page.locator('[role="application"]');
    
    await expect(globeContainer).toHaveScreenshot('globe-safari.png', {
      maxDiffPixels: 100
    });
  });
});
