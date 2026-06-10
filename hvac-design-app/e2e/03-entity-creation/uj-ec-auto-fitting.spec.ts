import { test, expect } from '@playwright/test';
import { openCanvas } from '../utils/test-utils';

async function drawDuct(page: import('@playwright/test').Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.click(from.x, from.y);
  await page.mouse.move(to.x, to.y);
  await page.mouse.click(to.x, to.y);
}

test.describe('UJ-EC: Auto-Fitting', () => {
  test('auto-fitting is on by default and creates a fitting at a duct junction', async ({ page }) => {
    await openCanvas(page, `Auto Fitting Project ${Date.now()}`);

    const canvas = page.locator('[data-testid="canvas-area"] canvas');
    await expect(canvas).toBeVisible();

    await page.getByTestId('tab-properties').click();
    await page.getByRole('button', { name: /Engineering/ }).click();
    const autoFittingToggle = page.getByRole('button', { name: 'Auto-Fitting' });
    await expect(autoFittingToggle).toBeVisible();
    await expect(autoFittingToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(autoFittingToggle).toContainText('ON');

    await page.keyboard.press('d');
    await expect(page.getByTestId('tool-duct')).toHaveAttribute('aria-pressed', 'true');

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const canvasBox = box!;
    const junction = {
      x: canvasBox.x + canvasBox.width * 0.32,
      y: canvasBox.y + canvasBox.height * 0.82,
    };

    await drawDuct(
      page,
      { x: canvasBox.x + canvasBox.width * 0.16, y: junction.y },
      { x: canvasBox.x + canvasBox.width * 0.48, y: junction.y }
    );

    await page.keyboard.press('Escape');
    await page.keyboard.press('d');

    await drawDuct(
      page,
      { x: junction.x, y: junction.y },
      { x: canvasBox.x + canvasBox.width * 0.42, y: canvasBox.y + canvasBox.height * 0.94 }
    );

    await page.getByTestId('tab-bom').click();
    await expect(page.getByTestId('bom-panel')).toBeVisible();
    await expect.poll(async () => await page.locator('[data-testid^="bom-row-"]').count()).toBeGreaterThan(0);
    await expect(page.getByRole('button', { name: /Fittings/ })).toBeVisible();

    await page.getByTestId('tab-validation').click();
    await expect(page.getByTestId('rerun-autofitting')).toBeVisible();
    await expect(page.getByTestId('reset-all-overrides')).toBeVisible();
  });
});
