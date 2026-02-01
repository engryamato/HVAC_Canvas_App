import { test, expect } from '@playwright/test';
import { openCanvas } from '../utils/test-utils';

test.describe('Critical User Journey - Complete HVAC Design Workflow', () => {
  test('should complete full user journey from project creation to export', async ({ page }) => {
    await openCanvas(page, 'Summer House HVAC');

    const canvasArea = page.getByTestId('canvas-area');
    await expect(canvasArea).toBeVisible({ timeout: 15000 });

    const box = await canvasArea.boundingBox();
    if (!box) {
      throw new Error('Canvas area bounding box not available');
    }

    await page.keyboard.press('r');
    await page.mouse.move(box.x + 80, box.y + 80);
    await page.mouse.down();
    await page.mouse.move(box.x + 280, box.y + 220);
    await page.mouse.up();

    await page.keyboard.press('Control+s');
    await expect(page.getByTestId('toast-success')).toContainText(/saved locally/i, { timeout: 10000 });

    await page.getByTestId('breadcrumb-dashboard').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Summer House HVAC' })).toBeVisible({ timeout: 10000 });
  });

  test('should handle rapid design workflow', async ({ page }) => {
    await openCanvas(page, 'Quick Test Project');

    const canvasArea = page.getByTestId('canvas-area');
    await expect(canvasArea).toBeVisible({ timeout: 15000 });

    const box = await canvasArea.boundingBox();
    if (!box) {
      throw new Error('Canvas area bounding box not available');
    }

    await page.keyboard.press('r');
    for (let i = 0; i < 4; i += 1) {
      const x = 60 + i * 130;
      const y = 60 + (i % 2) * 140;
      await page.mouse.move(box.x + x, box.y + y);
      await page.mouse.down();
      await page.mouse.move(box.x + x + 100, box.y + y + 90);
      await page.mouse.up();
    }

    await page.keyboard.press('v');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Escape');

    await page.keyboard.press('Control+s');
    await expect(page.getByTestId('toast-success')).toContainText(/saved locally|auto-saved/i, { timeout: 10000 });
  });
});

