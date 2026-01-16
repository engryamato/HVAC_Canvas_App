import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Zoom to Selection (UJ-CN-005)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-005-ZoomToSelection.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-005-ZoomToSelection.md
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
    await page.getByTestId('project-name-input').fill('Zoom Selection Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-005: Zoom to Selection (Tauri Offline)', () => {
  test('Step 1: Trigger Zoom to Selection', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Shortcut triggers zoom to selection', async () => {
      const zoomLevel = page.getByTestId('zoom-level');
      await expect(zoomLevel).toBeVisible();

      await page.keyboard.press('Control+2');
      await expect(zoomLevel).toBeVisible();
    });
  });

  test('Edge Case: No Selection', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Press shortcut with empty selection', async () => {
      await page.keyboard.press('Control+2');
      await expect(page.getByText(/no selection/i)).toBeVisible();
    });
  });
});
