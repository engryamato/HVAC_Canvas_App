import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Draw Room (UJ-EC-001)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-001-DrawRoom.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-001-DrawRoom.md
 * @mode tauri-offline
 */

import { openCanvas, ensurePropertiesPanelVisible } from '../../utils/test-utils';


test.describe('UJ-EC-001: Draw Room (Tauri Offline)', () => {
  test('Step 1: Activate Room Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Room Creation Project');
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('r');
      const roomTool = page.getByTestId('tool-room');
      await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
      const statusBar = page.getByTestId('status-bar');
      await expect(statusBar).toContainText('Room Tool');
    });
  });

  test('Step 2-4: Draw Room on Canvas', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Room Creation Project');
    });

    await test.step('Activate Room tool', async () => {
      await page.keyboard.press('r');
      await expect(page.getByTestId('tool-room')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2-4: Drag to create room', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.mouse.move(500, 300);
      await page.mouse.down();
      await page.mouse.move(700, 500);
      await page.mouse.up();

      await expect(page.getByTestId('status-bar')).toContainText('Room');
    });
  });

  test('Step 5: View Room Properties', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Room Creation Project');
    });

    await test.step('Create room', async () => {
      await page.keyboard.press('r');
      const _canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(_canvas).toBeVisible();
      await page.waitForTimeout(1000); // Wait for hydration/mounting
      
      // Verify tool is active
      await expect(page.getByTestId('status-bar')).toContainText('Room Tool');
      
      const box = await _canvas.boundingBox();
      if (box) {
         // Center of canvas, guaranteed to be safe
         const startX = box.x + box.width / 2 - 100;
         const startY = box.y + box.height / 2 - 100;
         const endX = startX + 200;
         const endY = startY + 200;
         
         await page.mouse.move(startX, startY);
         await page.mouse.down();
         await page.mouse.move(endX, endY, { steps: 10 });
         await page.mouse.up();
      } else {
         throw new Error('Canvas box not found');
      }
      
      await page.waitForTimeout(500);
      
      // Verify creation via status bar item count
      await expect(page.getByTestId('status-bar')).toContainText('1 items');
    });

    await test.step('Step 5: Verify Properties Panel shows room properties', async () => {
      // Switch to Select tool
      await page.keyboard.press('v');
      await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
      
      // Click the center of the room to select it
      // We know coordinates from previous step (calculated relative to canvas)
      // But we can't easily share variables between steps in Playwright unless defined outside.
      // However, we know we drew it at center-100 to center+100.
      // So clicking center of canvas should hit it.
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
      
      // Ensure properties panel is visible using helper
      await ensurePropertiesPanelVisible(page);
      
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toContainText('Room');
    });
  });
});
