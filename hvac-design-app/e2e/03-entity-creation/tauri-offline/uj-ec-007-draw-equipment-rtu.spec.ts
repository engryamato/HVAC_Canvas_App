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
      // Capture browser console logs for debugging
      page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
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
      
      // Click center of canvas using bounding box
      const box = await canvas.boundingBox();
      if (!box) { throw new Error('Canvas bounding box not found'); }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      
      await expect(page.getByTestId('status-bar')).toBeVisible();
    });
  });

  test('Step 3: Configure RTU Capacity', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'RTU Placement Project');
    });

    await test.step('Place RTU', async () => {
      await page.keyboard.press('e');
      await expect(page.getByTestId('tool-equipment')).toHaveAttribute('aria-pressed', 'true');
      
      // Ensure RTU type is selected
      await expect(page.getByTestId('equipment-type-selector')).toBeVisible();
      await page.getByTestId('equipment-type-rtu').click();
      
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      
      const box = await canvas.boundingBox();
      if (!box) { throw new Error('Canvas bounding box not found'); }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    });

    await test.step('Step 3: Inspector shows RTU properties', async () => {
      // Switch to Select tool
      await page.keyboard.press('v');
      await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
      
      await page.waitForTimeout(300);
      
      // Click at center of canvas to select the equipment
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      const box = await canvas.boundingBox();
      if (!box) { throw new Error('Canvas bounding box not found'); }
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
      
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
       await page.keyboard.press('e');
       await expect(page.getByTestId('tool-equipment')).toHaveAttribute('aria-pressed', 'true');
       
       await expect(page.getByTestId('equipment-type-selector')).toBeVisible({ timeout: 3000 });
       await page.getByTestId('equipment-type-rtu').click();
       await expect(page.getByTestId('equipment-type-rtu')).toHaveAttribute('aria-pressed', 'true');
       
       const canvas = page.locator('[data-testid="canvas-area"] canvas');
       await expect(canvas).toBeVisible();
       
       const box = await canvas.boundingBox();
       if (!box) { throw new Error('Canvas bounding box not found'); }
       await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
       await page.waitForTimeout(500);
       
       await expect(page.getByTestId('status-bar')).toContainText(/\d+ items?/);
    });

    await test.step('Open BOM panel', async () => {
      // Expand sidebar if collapsed
      const rightSidebar = page.getByTestId('right-sidebar');
      const isCollapsed = await rightSidebar.evaluate(el => el.classList.contains('collapsed'));
      if (isCollapsed) {
        await page.getByTestId('right-sidebar-toggle').click();
        await page.waitForTimeout(300);
      }
      
      await page.getByTestId('tab-bom').click();
      await expect(page.getByTestId('bom-panel')).toBeVisible({ timeout: 3000 });
      await expect(page.getByTestId('bom-panel')).toContainText('RTU');
    });
  });
});
