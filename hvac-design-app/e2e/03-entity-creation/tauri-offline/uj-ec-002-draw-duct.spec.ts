import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Draw Duct (UJ-EC-002)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-002-DrawDuct.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-002-DrawDuct.md
 * @mode tauri-offline
 */

import { openCanvas, ensurePropertiesPanelVisible } from '../../utils/test-utils';

test.describe('UJ-EC-002: Draw Duct (Tauri Offline)', () => {
  test('Step 1: Activate Duct Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Duct Creation Project');
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('d');
      const ductTool = page.getByTestId('tool-duct');
      await expect(ductTool).toHaveAttribute('aria-pressed', 'true');
      const statusBar = page.getByTestId('status-bar');
      await expect(statusBar).toContainText('Duct Tool');
    });
  });

  test('Step 2-4: Draw Duct on Canvas', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Duct Creation Project');
    });

    await test.step('Activate Duct tool', async () => {
      await page.keyboard.press('d');
      await expect(page.getByTestId('tool-duct')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2-4: Drag to create duct', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(460, 220);
      await page.mouse.up();

      await expect(page.getByTestId('status-bar')).toContainText('Duct');
    });
  });

  test('Step 5: View and Edit Duct Properties', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Duct Creation Project');
    });

    await test.step('Create duct', async () => {
      await page.keyboard.press('d');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      
      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(460, 220);
      await page.mouse.up();
      
      await page.waitForTimeout(500);
    });

    await test.step('Step 5: Verify Properties Panel shows duct properties', async () => {
      // Switch to Select tool
      await page.keyboard.press('v');
      await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
      
      // Click near the center of the duct to select it
      // Drawn from (200, 200) to (460, 220). Midpoint (330, 210).
      await page.mouse.click(330, 210);
      
      // Ensure properties panel is visible using helper
      await ensurePropertiesPanelVisible(page);
      
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toContainText('Duct');
    });
  });
});
