import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Fit to View (UJ-CN-003)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-003-FitToView.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-003-FitToView.md
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
    await page.getByTestId('project-name-input').fill('Fit View Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-003: Fit to View (Tauri Offline)', () => {
  test('Step 1: Trigger Fit All', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Fit all via shortcut or control', async () => {
      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toBeVisible();
      const before = await zoomLevel.textContent();

      await page.keyboard.press('Control+1');

      await expect(zoomLevel).not.toHaveText(before || '');
    });
  });

  test('Step 2: Window Maximization', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 2: Resize window keeps canvas responsive', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.setViewportSize({ width: 1600, height: 900 });
      await expect(canvas).toBeVisible();
    });
  });
});
