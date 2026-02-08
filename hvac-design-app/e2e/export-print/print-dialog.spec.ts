import { test, expect } from '@playwright/test';
import { openCanvas } from '../utils/test-utils';
import { setLightMode } from '../utils/theme-utils';

test.describe('Print Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await openCanvas(page, 'Print Dialog Project');
    await page.waitForLoadState('networkidle');
    await setLightMode(page);
  });

  test('opens and renders layout', async ({ page }) => {
    await page.getByRole('button', { name: 'Print...' }).click();

    const dialog = page.getByTestId('print-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Print' })).toBeVisible();
    await expect(dialog).toHaveScreenshot('print-dialog-layout.png');
  });

  test('updates orientation and scale', async ({ page }) => {
    await page.getByRole('button', { name: 'Print...' }).click();

    const dialog = page.getByTestId('print-dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByText('Landscape').click();
    await dialog.getByText('Custom').click();
    await dialog.getByLabel('Scale (%)').fill('125');

    await expect(dialog).toHaveScreenshot('print-dialog-custom.png');
  });
});
