import { test, expect } from '@playwright/test';
import { openCanvas } from '../../utils/test-utils';

test.describe('UJ-EC: Auto-Fitting (Tauri Offline)', () => {
  test('Auto-fitting creates a fitting at a duct junction and exposes validation actions', async ({ page }) => {
    await openCanvas(page, 'Auto Fitting Project');

    const canvas = page.locator('[data-testid="canvas-area"] canvas');
    await expect(canvas).toBeVisible();

    await page.keyboard.press('d');
    await expect(page.getByTestId('tool-duct')).toHaveAttribute('aria-pressed', 'true');

    await page.mouse.move(180, 220);
    await page.mouse.down();
    await page.mouse.move(420, 220);
    await page.mouse.up();

    await page.mouse.move(300, 120);
    await page.mouse.down();
    await page.mouse.move(300, 320);
    await page.mouse.up();

    await page.waitForTimeout(800);

    await page.getByTestId('tab-bom').click();
    await expect(page.getByTestId('bom-panel')).toBeVisible();
    await page.getByRole('button', { name: 'Fittings' }).click();
    await expect.poll(async () => await page.locator('[data-testid^="bom-row-"]').count()).toBeGreaterThan(0);

    await page.getByTestId('tab-validation').click();
    await expect(page.getByTestId('rerun-autofitting')).toBeVisible();
    await expect(page.getByTestId('reset-all-overrides')).toBeVisible();
  });
});
