import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Reset View / Fit to Window (UJ-CN-004)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-004-ResetViewFitToWindow.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-004-ResetViewFitToWindow.md
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
    await page.getByTestId('project-name-input').fill('Reset View Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-004: Reset View / Fit to Window (Tauri Offline)', () => {
  test('Step 1: Trigger Reset', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Reset view via shortcut', async () => {
      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toBeVisible();

      await page.keyboard.press('Control+0');

      await expect(zoomLevel).toContainText('100');
    });
  });

  test('Step 2: Window Snapping', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 2: Resize window keeps canvas responsive', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.setViewportSize({ width: 1200, height: 700 });
      await expect(canvas).toBeVisible();
    });
  });
});
