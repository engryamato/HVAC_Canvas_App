import { test, expect } from '@playwright/test';
import { openCanvas, ensurePropertiesPanelVisible } from '../../utils/test-utils';
import { withThemeVariants, setLightMode } from '../../utils/theme-utils';

test.describe('Inspector Panel Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Open a new canvas
    await openCanvas(page, 'Inspector Visual Test');
    await page.waitForLoadState('networkidle');
    await ensurePropertiesPanelVisible(page);
    await setLightMode(page);
  });

  test('should display inspector in empty state (Canvas Properties)', async ({ page }) => {
    await withThemeVariants(page, async (theme) => {
      const inspectorPanel = page.locator('data-testid=right-sidebar');
      
      if (await inspectorPanel.isVisible()) {
        await expect(inspectorPanel).toHaveScreenshot(`inspector-empty-${theme}.png`);
      }
    });
  });

  test('should resize to minimum width (280px)', async ({ page }) => {
    await setLightMode(page);
    const inspectorPanel = page.locator('data-testid=right-sidebar');
    const resizeHandle = page.locator('.resize-handle-left');

    // Drag to resize smaller
    const boundingBox = await inspectorPanel.boundingBox();
    if (boundingBox) {
        await resizeHandle.hover();
        await page.mouse.down();
        await page.mouse.move(boundingBox.x + boundingBox.width, boundingBox.y); // Move completely right? No, move to drag handle position and then drag right
        // Handle is on left. Panel is on right.
        // BoundingBox.x is the left edge of the sidebar.
        // We want to drag it to the right (increase x) to reduce width.
        // Target width 280. Current 320.
        // Drag +40px right.
        await page.mouse.move(boundingBox.x + 100, boundingBox.y); // Overshoot
        await page.mouse.up();
    }
    
    await expect(inspectorPanel).toHaveScreenshot('inspector-min-width.png');
  });

  test('should resize to maximum width (480px)', async ({ page }) => {
    await setLightMode(page);
    const inspectorPanel = page.locator('data-testid=right-sidebar');
    const resizeHandle = page.locator('.resize-handle-left');

    // Drag to resize larger
    const boundingBox = await inspectorPanel.boundingBox();
    if (boundingBox) {
        await resizeHandle.hover();
        await page.mouse.down();
        // Drag left to increase width
        await page.mouse.move(boundingBox.x - 200, boundingBox.y); // Overshoot
        await page.mouse.up();
    }
    
    await expect(inspectorPanel).toHaveScreenshot('inspector-max-width.png');
  });

  test('should show resize handle hover state', async ({ page }) => {
    await setLightMode(page);
    const resizeHandle = page.locator('.resize-handle-left');
    await resizeHandle.hover();
    
    // Screenshot just the resize area + bit of sidebar
    const inspectorPanel = page.locator('data-testid=right-sidebar');
    await expect(inspectorPanel).toHaveScreenshot('inspector-resize-hover.png');
  });

  test('should display room inspector with expanded/collapsed sections', async ({ page }) => {
    await withThemeVariants(page, async (theme) => {
      // Create a room
      await page.keyboard.press('r');
      const canvas = page.locator('canvas').first();
      // Draw room
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.mouse.move(300, 300);
      await page.mouse.down();
      await page.mouse.up();
      
      // Select the room
      await page.mouse.click(200, 200);
      await page.waitForTimeout(200);

      const inspectorPanel = page.locator('data-testid=right-sidebar');
      await expect(inspectorPanel).toHaveScreenshot(`inspector-room-${theme}.png`);
      
      // Expand "Identity" section
      const identityTrigger = inspectorPanel.getByRole('button', { name: /Identity/i });
      if (await identityTrigger.isVisible()) {
        await identityTrigger.click();
        await page.waitForTimeout(300); // Wait for animation
        await expect(inspectorPanel).toHaveScreenshot(`inspector-room-identity-expanded-${theme}.png`);
        
        // Check focus ring (Technical Blue)
        await expect(identityTrigger).toHaveCSS('ring-color', 'rgb(59, 130, 246)'); // #3b82f6 -> rgb
      }
    });
  });

  test('should display multi-selection state', async ({ page }) => {
    await withThemeVariants(page, async (theme) => {
      const canvas = page.locator('canvas').first();

      // Create Room 1
      await page.keyboard.press('r');
      await canvas.click({ position: { x: 50, y: 50 } });
      await page.mouse.move(150, 150);
      await page.mouse.down();
      await page.mouse.up();
      
      // Create Room 2
      await page.keyboard.press('r');
      await canvas.click({ position: { x: 200, y: 50 } });
      await page.mouse.move(300, 150);
      await page.mouse.down();
      await page.mouse.up();

      // Select both
      await page.keyboard.down('Shift');
      await page.mouse.click(100, 100);
      await page.mouse.click(250, 100);
      await page.keyboard.up('Shift');
      
      await page.waitForTimeout(200);

      const inspectorPanel = page.locator('data-testid=right-sidebar');
      await expect(inspectorPanel).toHaveScreenshot(`inspector-multi-${theme}.png`);
    });
  });
});
