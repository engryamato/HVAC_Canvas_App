import { test, expect } from '@playwright/test';

import { openCanvas } from '../utils/test-utils';

test.describe('Canvas Composition', () => {
  test('renders header, toolbar, sidebars, and status bar', async ({ page }) => {
    await openCanvas(page, 'Canvas Composition Project');

    await expect(page.getByTestId('header')).toBeVisible();
    await expect(page.getByTestId('toolbar')).toBeVisible();
    await expect(page.getByTestId('left-sidebar')).toBeVisible();
    await expect(page.getByTestId('right-sidebar')).toBeVisible();
    await expect(page.getByTestId('status-bar')).toBeVisible();

    await expect(page.locator('canvas')).toBeVisible();
  });
});

