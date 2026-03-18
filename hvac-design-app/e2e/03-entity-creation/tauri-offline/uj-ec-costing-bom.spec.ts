import { test, expect } from '@playwright/test';
import { ensurePropertiesPanelVisible, openCanvas } from '../../utils/test-utils';

test.describe('UJ-EC: Costing and BOM Navigation (Tauri Offline)', () => {
  test('Duct costing is visible and See in BOM highlights the matching row', async ({ page }) => {
    await openCanvas(page, 'Costing BOM Project');

    const canvas = page.locator('[data-testid="canvas-area"] canvas');
    await expect(canvas).toBeVisible();

    await page.keyboard.press('d');
    await page.mouse.move(210, 240);
    await page.mouse.down();
    await page.mouse.move(470, 240);
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.keyboard.press('v');
    await page.mouse.click(340, 240);
    await ensurePropertiesPanelVisible(page);

    const ductInspector = page.getByTestId('duct-inspector');
    await expect(ductInspector).toContainText('Material Cost');
    await expect(ductInspector).toContainText('Labor Hours');
    await expect(ductInspector).toContainText('Labor Cost');
    await expect(ductInspector).toContainText('Total (w/ markup)');

    await page.getByTestId('see-in-bom').click();

    await expect(page.getByTestId('tab-bom')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid^="bom-row-"][data-highlighted="true"]').first()).toBeVisible();
  });
});
