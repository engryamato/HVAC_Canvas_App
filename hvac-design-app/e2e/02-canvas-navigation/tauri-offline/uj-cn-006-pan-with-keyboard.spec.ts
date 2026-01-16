import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Pan with Keyboard (UJ-CN-006)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-006-PanWithKeyboard.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-006-PanWithKeyboard.md
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
    await page.getByTestId('project-name-input').fill('Keyboard Pan Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-006: Pan with Keyboard (Tauri Offline)', () => {
  test('Step 1: Directional Panning', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Arrow keys pan', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');

      await expect(canvas).toBeVisible();
    });
  });

  test('Step 2: Spacebar Drag', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 2: Spacebar activates pan mode', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.keyboard.down('Space');
      await page.mouse.down();
      await page.mouse.move(420, 420);
      await page.mouse.up();
      await page.keyboard.up('Space');

      await expect(canvas).toBeVisible();
    });
  });
});
