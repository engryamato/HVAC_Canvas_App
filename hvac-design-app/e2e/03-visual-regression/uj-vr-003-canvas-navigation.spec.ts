import { test, expect } from '@playwright/test';
import { openCanvas } from '../utils/test-utils';
import { withThemeVariants, setLightMode } from '../utils/theme-utils';

/**
 * Visual Regression Tests for Canvas Navigation
 * Verifies zoom controls, minimap, and navigation interactions
 */

test.describe('Canvas Navigation Visual Tests', () => {
  test.describe('Zoom Controls Appearance', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Zoom Controls Test');
      await page.waitForLoadState('networkidle');
      await setLightMode(page);
    });

    test('should display zoom controls default state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomControls = page.getByTestId('zoom-control');
        await expect(zoomControls).toBeVisible();
        await expect(zoomControls).toHaveScreenshot(`zoom-controls-default-${theme}.png`);
      });
    });

    test('should display zoom dropdown when clicked', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomLevel = page.getByTestId('zoom-level');
        await zoomLevel.click();
        await page.waitForTimeout(200);
        
        // Capture full page to show dropdown
        await expect(page).toHaveScreenshot(`zoom-controls-dropdown-open-${theme}.png`);
      });
    });

    test('should display zoom in button hover state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomInBtn = page.getByTestId('zoom-in');
        await zoomInBtn.hover();
        await page.waitForTimeout(150);
        await expect(zoomInBtn).toHaveScreenshot(`zoom-in-hover-${theme}.png`);
      });
    });

    test('should display zoom out button hover state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomOutBtn = page.getByTestId('zoom-out');
        await zoomOutBtn.hover();
        await page.waitForTimeout(150);
        await expect(zoomOutBtn).toHaveScreenshot(`zoom-out-hover-${theme}.png`);
      });
    });

    test('should display grid toggle active state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const gridToggle = page.getByTestId('grid-toggle');
        await expect(gridToggle).toHaveScreenshot(`grid-toggle-active-${theme}.png`);
        
        // Toggle off and capture
        await gridToggle.click();
        await page.waitForTimeout(100);
        await expect(gridToggle).toHaveScreenshot(`grid-toggle-inactive-${theme}.png`);
      });
    });
  });

  test.describe('Minimap Rendering', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Minimap Test');
      await page.waitForLoadState('networkidle');
      await setLightMode(page);
    });

    test('should display minimap default state', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const minimap = page.getByTestId('minimap');
        if (await minimap.isVisible()) {
          await expect(minimap).toHaveScreenshot(`minimap-default-${theme}.png`);
        }
      });
    });

    test('should display minimap with entities', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        // Create a room
        await page.keyboard.press('r');
        const canvas = page.locator('canvas').first();
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 100, box.y + 100);
          await page.mouse.down();
          await page.mouse.move(box.x + 300, box.y + 200);
          await page.mouse.up();
          await page.waitForTimeout(500);
        }

        // Create another entity
        await page.keyboard.press('e');
        if (box) {
          await page.mouse.click(box.x + 400, box.y + 150);
          await page.waitForTimeout(300);
        }

        // Switch to select mode
        await page.keyboard.press('v');
        await page.waitForTimeout(200);

        const minimap = page.getByTestId('minimap');
        if (await minimap.isVisible()) {
          await expect(minimap).toHaveScreenshot(`minimap-with-entities-${theme}.png`);
        }
      });
    });

    test('should display minimap after panning', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        // Create a room first
        await page.keyboard.press('r');
        const canvas = page.locator('canvas').first();
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 100, box.y + 100);
          await page.mouse.down();
          await page.mouse.move(box.x + 300, box.y + 200);
          await page.mouse.up();
          await page.waitForTimeout(300);
        }

        // Switch to select and pan
        await page.keyboard.press('v');
        
        // Pan the canvas using space + drag
        await page.keyboard.down('Space');
        if (box) {
          await page.mouse.move(box.x + 200, box.y + 200);
          await page.mouse.down();
          await page.mouse.move(box.x + 400, box.y + 350);
          await page.mouse.up();
        }
        await page.keyboard.up('Space');
        await page.waitForTimeout(300);

        const minimap = page.getByTestId('minimap');
        if (await minimap.isVisible()) {
          await expect(minimap).toHaveScreenshot(`minimap-panned-${theme}.png`);
        }
      });
    });
  });

  test.describe('Zoom Transitions', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Zoom Transition Test');
      await page.waitForLoadState('networkidle');
      await setLightMode(page);
    });

    test('should display zoom level after zoom in', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomLevel = page.getByTestId('zoom-level');
        const initialText = await zoomLevel.textContent();
        
        // Zoom in
        await page.getByTestId('zoom-in').click();
        await page.waitForTimeout(250); // Wait for transition to complete
        
        const newText = await zoomLevel.textContent();
        expect(newText).not.toBe(initialText);
        
        await expect(page.getByTestId('zoom-control')).toHaveScreenshot(`zoom-level-after-zoom-in-${theme}.png`);
      });
    });

    test('should display zoom level after preset selection', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomLevel = page.getByTestId('zoom-level');
        await zoomLevel.click();
        await page.waitForTimeout(200);
        
        // Select 200% preset
        const preset200 = page.getByRole('option', { name: '200%' });
        if (await preset200.isVisible()) {
          await preset200.click();
          await page.waitForTimeout(250); // Wait for transition
          
          await expect(page.getByTestId('zoom-control')).toHaveScreenshot(`zoom-level-200-percent-${theme}.png`);
        }
      });
    });
  });

  test.describe('Pan Cursor States', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Cursor State Test');
      await page.waitForLoadState('networkidle');
      await setLightMode(page);
    });

    test('should display grab cursor when space pressed', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const canvas = page.locator('canvas').first();
        
        // Press space to enter pan mode
        await page.keyboard.down('Space');
        await page.waitForTimeout(100);
        
        // Capture canvas with grab cursor
        await expect(canvas).toHaveScreenshot(`canvas-cursor-grab-${theme}.png`);
        
        await page.keyboard.up('Space');
      });
    });

    test('should display grabbing cursor during pan', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const canvas = page.locator('canvas').first();
        const box = await canvas.boundingBox();
        
        // Press space and start dragging
        await page.keyboard.down('Space');
        if (box) {
          await page.mouse.move(box.x + 200, box.y + 200);
          await page.mouse.down();
          await page.waitForTimeout(100);
          
          // Capture canvas with grabbing cursor
          await expect(canvas).toHaveScreenshot(`canvas-cursor-grabbing-${theme}.png`);
          
          await page.mouse.up();
        }
        await page.keyboard.up('Space');
      });
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      await openCanvas(page, 'Keyboard Shortcut Test');
      await page.waitForLoadState('networkidle');
      await setLightMode(page);
    });

    test('should zoom with keyboard shortcuts', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        const zoomLevel = page.getByTestId('zoom-level');
        
        // Zoom in with Ctrl+Plus
        await page.keyboard.press('Control+=');
        await page.waitForTimeout(250);
        
        await expect(page.getByTestId('zoom-control')).toHaveScreenshot(`zoom-after-ctrl-plus-${theme}.png`);
        
        // Zoom out with Ctrl+Minus
        await page.keyboard.press('Control+-');
        await page.keyboard.press('Control+-');
        await page.waitForTimeout(250);
        
        await expect(page.getByTestId('zoom-control')).toHaveScreenshot(`zoom-after-ctrl-minus-${theme}.png`);
      });
    });

    test('should reset zoom with Ctrl+0', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        // First zoom in
        await page.getByTestId('zoom-in').click();
        await page.getByTestId('zoom-in').click();
        await page.waitForTimeout(250);
        
        // Reset with Ctrl+0
        await page.keyboard.press('Control+0');
        await page.waitForTimeout(250);
        
        // Verify zoom is reset to 100%
        const zoomLevelText = await page.getByTestId('zoom-level').textContent();
        expect(zoomLevelText).toContain('100%');
        
        await expect(page.getByTestId('zoom-control')).toHaveScreenshot(`zoom-after-ctrl-0-${theme}.png`);
      });
    });

    test('should zoom to selection with F key', async ({ page }) => {
      await withThemeVariants(page, async (theme) => {
        // Create and select an entity
        await page.keyboard.press('r');
        const canvas = page.locator('canvas').first();
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + 50, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 150, box.y + 100);
          await page.mouse.up();
          await page.waitForTimeout(300);
        }

        // Switch to select mode
        await page.keyboard.press('v');
        await page.waitForTimeout(100);
        
        // Press F to zoom to selection
        await page.keyboard.press('f');
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot(`zoom-to-selection-${theme}.png`);
      });
    });
  });
});
