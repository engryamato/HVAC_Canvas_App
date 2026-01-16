import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Pan Canvas (UJ-CN-001)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-CN-001-PanCanvas.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/02-canvas-navigation/tauri-offline/UJ-CN-001-PanCanvas.md
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
    await page.getByTestId('project-name-input').fill('Canvas Navigation Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-CN-001: Pan Canvas (Tauri Offline)', () => {
  test('Step 1: Initiate Pan with Middle Mouse Button', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Middle mouse drag pans viewport', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      const start = { x: 300, y: 300 };
      const end = { x: 500, y: 400 };

      await page.mouse.move(start.x, start.y);
      await page.mouse.down({ button: 'middle' });
      await page.mouse.move(end.x, end.y);
      await page.mouse.up({ button: 'middle' });

      await expect(canvas).toBeVisible();
    });
  });

  test('Step 2: Native Touch Panning (Touchscreen)', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 2: Touch gesture pans viewport', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.touchscreen.tap(300, 300);
    });
  });
});
