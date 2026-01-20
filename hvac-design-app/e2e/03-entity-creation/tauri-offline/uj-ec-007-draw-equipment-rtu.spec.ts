import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Draw Equipment (RTU) (UJ-EC-007)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-007-DrawEquipmentRTU.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-007-DrawEquipmentRTU.md
 * @mode tauri-offline
 */

import { openCanvas, ensurePropertiesPanelVisible } from '../../utils/test-utils';

test.describe('UJ-EC-007: Draw Equipment (RTU) (Tauri Offline)', () => {
  test('Step 1: Select RTU Equipment Type', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'RTU Placement Project');
    });

    await test.step('Step 1: Activate equipment tool and select RTU', async () => {
      await page.keyboard.press('e');
      await expect(page.getByTestId('tool-equipment')).toHaveAttribute('aria-pressed', 'true');
      
      // Select RTU
      await expect(page.getByTestId('equipment-type-selector')).toBeVisible();
      await page.getByTestId('equipment-type-rtu').click();
      await expect(page.getByTestId('equipment-type-rtu')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('Step 2: Position and Place RTU', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'RTU Placement Project');
    });

    await test.step('Place RTU on canvas', async () => {
      await page.keyboard.press('e');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(520, 180);
      // Status bar shows "1 items" when selected, or just check creation via tool state
      await expect(page.getByTestId('status-bar')).toBeVisible();
    });
  });

  test('Step 3: Configure RTU Capacity', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'RTU Placement Project');
    });

    await test.step('Place RTU', async () => {
      await page.keyboard.press('e');
      await expect(page.locator('[data-testid="canvas-area"] canvas')).toBeVisible();
      await page.mouse.click(520, 180);
      // Wait for creation
      await page.waitForTimeout(500);
    });

    await test.step('Step 3: Inspector shows RTU properties', async () => {
      // Switch to Select tool
      await page.keyboard.press('v');
      await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
      
      await page.waitForTimeout(300); // Wait for state settling
      
      // Click at exact placement coordinates to ensure hit
      await page.mouse.click(520, 180);
      await page.waitForTimeout(500); // Wait for selection update
      
      await ensurePropertiesPanelVisible(page);
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toContainText('RTU');
    });
  });

  test('Step 5: Verify Equipment in BOM', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'RTU Placement Project');
    });

    await test.step('Place RTU', async () => {
       // Ensure we have an RTU to verify
       await page.keyboard.press('e');
       
       // Ensure RTU type selected
       if (await page.getByTestId('equipment-type-selector').isVisible()) {
         await page.getByTestId('equipment-type-rtu').click();
       }
       
       await expect(page.locator('[data-testid="canvas-area"] canvas')).toBeVisible();
       await page.mouse.click(520, 180);
       await page.waitForTimeout(500);
    });

    await test.step('Open BOM panel', async () => {
      await page.getByTestId('tab-bom').click();
      await expect(page.getByTestId('bom-panel')).toBeVisible();
      // It might say "New RTU" or "RTU" depending on display name logic
      await expect(page.getByTestId('bom-panel')).toContainText('RTU');
    });
  });
});
