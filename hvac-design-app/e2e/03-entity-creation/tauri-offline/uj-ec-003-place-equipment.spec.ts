import { test, expect } from '@playwright/test';
import { openCanvas, ensurePropertiesPanelVisible } from '../../utils/test-utils';



/**
 * E2E Test Suite: Place Equipment (UJ-EC-003)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-003-PlaceEquipment.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-003-PlaceEquipment.md
 * @mode tauri-offline
 */

test.describe('UJ-EC-003: Place Equipment (Tauri Offline)', () => {
  test('Step 1: Activate Equipment Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Equipment Placement Project');
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('e');
      const equipmentTool = page.getByTestId('tool-equipment');
      await expect(equipmentTool).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.equipment-type-selector')).toBeVisible();
      await expect(page.getByTestId('status-bar')).toContainText('Equipment Tool');
    });
  });

  test('Step 2-4: Select and place equipment', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Equipment Placement Project');
    });

    await test.step('Activate Equipment tool', async () => {
      await page.keyboard.press('e');
      await expect(page.getByTestId('tool-equipment')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2: Select Furnace', async () => {
      // Wait for equipment type selector to be visible
      await expect(page.getByTestId('equipment-type-selector')).toBeVisible();
      
      // Click Furnace button in type selector
      await page.getByTestId('equipment-type-furnace').click();
      
      // Verify furnace is selected (button should be pressed)
      await expect(page.getByTestId('equipment-type-furnace')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 3-4: Click to place equipment', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(320, 240);
      await expect(page.getByTestId('status-bar')).toContainText('Furnace');
    });
  });

  test('Step 5: Configure Equipment Properties', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Equipment Placement Project');
    });

    await test.step('Place equipment', async () => {
      await page.keyboard.press('e');
      await expect(page.locator('[data-testid="canvas-area"] canvas')).toBeVisible();
      await page.mouse.click(330, 250); // 320+10, 240+10
    });

    await test.step('Step 5: Inspector shows equipment properties', async () => {
      // Switch to Select tool
      await page.keyboard.press('v');
      await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
      
      // Select the equipment (placed at 330, 250)
      await page.mouse.click(330, 250);
      
      await ensurePropertiesPanelVisible(page);
      
      const propertiesPanel = page.getByTestId('properties-panel');
      // Should show 'Furnace' if defaults work, or 'Equipment' generic
      // Based on defaults name is "New Furnace"
      await expect(propertiesPanel).toContainText('Furnace');
    });
  });
});
