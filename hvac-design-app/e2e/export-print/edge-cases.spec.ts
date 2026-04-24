import { test, expect } from '@playwright/test';
import { openCanvas } from '../utils/test-utils';
import { setLightMode } from '../utils/theme-utils';

test.describe('Export Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvas(page, 'Export Edge Cases');
    await page.waitForLoadState('networkidle');
    await setLightMode(page);
  });

  test('shows empty canvas warning', async ({ page }) => {
    await page.getByRole('button', { name: 'Export...' }).click();
    await page.getByTestId('enhanced-export-dialog').getByRole('button', { name: 'Export' }).click();

    const dialog = page.getByTestId('empty-canvas-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot('export-empty-warning.png');
  });

  test('shows unsaved changes warning', async ({ page }) => {
    await page.keyboard.press('r');
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 120);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: 'Export...' }).click();
    await page.getByTestId('enhanced-export-dialog').getByRole('button', { name: 'Export' }).click();

    const dialog = page.getByTestId('export-unsaved-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveScreenshot('export-unsaved-warning.png');
  });
});
