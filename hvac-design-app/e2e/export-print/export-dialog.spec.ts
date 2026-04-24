import { test, expect } from '@playwright/test';
import { openCanvas } from '../utils/test-utils';
import { setLightMode } from '../utils/theme-utils';

test.describe('Export Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvas(page, 'Export Dialog Project');
    await page.waitForLoadState('networkidle');
    await setLightMode(page);
  });

  test('opens and renders layout', async ({ page }) => {
    await page.getByRole('button', { name: 'Export...' }).click();

    const dialog = page.getByTestId('enhanced-export-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Export' })).toBeVisible();
    await expect(dialog).toHaveScreenshot('export-dialog-layout.png');
  });

  test('updates preview when format changes', async ({ page }) => {
    await page.getByRole('button', { name: 'Export...' }).click();

    const dialog = page.getByTestId('enhanced-export-dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByText('PNG').click();
    await page.waitForTimeout(400);

    const previewImage = dialog.getByAltText('Canvas preview');
    await expect(previewImage).toBeVisible();
    await expect(dialog).toHaveScreenshot('export-dialog-png.png');
  });

  test('shows progress indicator on export', async ({ page }) => {
    await page.getByRole('button', { name: 'Export...' }).click();
    const dialog = page.getByTestId('enhanced-export-dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Export' }).click();
    await page.waitForTimeout(650);

    const progress = dialog.getByRole('progressbar');
    await expect(progress).toBeVisible();
  });
});
