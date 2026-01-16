import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Zoom Canvas (UJ-CN-002)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-002-ZoomCanvas.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-002-ZoomCanvas.md
 * @mode tauri-offline
 */

async function openCanvas(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({
      state: { hasLaunched: true },
      version: 0,
    }));
  });

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/dashboard/);

  const projectCards = page.locator('[data-testid="project-card"]');
  if ((await projectCards.count()) === 0) {
    const emptyStateButton = page.getByTestId('empty-state-create-btn');
    const newProjectButton = page.getByTestId('new-project-btn');
    if (await emptyStateButton.isVisible()) {
      await emptyStateButton.click();
    } else {
      await newProjectButton.click();
    }
    await page.getByTestId('project-name-input').fill('Canvas Zoom Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-002: Zoom Canvas (Tauri Offline)', () => {
  test('Step 1: Zoom with Mouse Wheel', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Wheel zoom updates zoom indicator', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toBeVisible();
      const initialZoom = await zoomLevel.textContent();

      await canvas.hover();
      await page.mouse.wheel(0, -200);

      await expect(zoomLevel).not.toHaveText(initialZoom || '');
    });
  });

  test('Step 2: Native Pinch Zoom (Touchpad/Touchscreen)', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 2: Touch gesture does not crash', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.touchscreen.tap(320, 320);
      await expect(canvas).toBeVisible();
    });
  });
});
