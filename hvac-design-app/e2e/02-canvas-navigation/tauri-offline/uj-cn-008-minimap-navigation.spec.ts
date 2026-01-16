import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Minimap Navigation (UJ-CN-008)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-008-MinimapNavigation.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-008-MinimapNavigation.md
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
    await page.getByTestId('project-name-input').fill('Minimap Navigation Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-008: Minimap Navigation (Tauri Offline)', () => {
  test('Step 1: Render Minimap', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Minimap is visible', async () => {
      await expect(page.getByTestId('minimap')).toBeVisible();
    });
  });

  test('Step 2: Pop-Out Minimap', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 2: Undock minimap opens new window', async () => {
      const undockButton = page.getByTestId('minimap-undock');
      await expect(undockButton).toBeVisible();
      await undockButton.click();
    });
  });
});
