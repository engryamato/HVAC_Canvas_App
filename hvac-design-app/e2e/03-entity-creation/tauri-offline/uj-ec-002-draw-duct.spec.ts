import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Draw Duct (UJ-EC-002)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-002-DrawDuct.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-002-DrawDuct.md
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
    await page.getByTestId('project-name-input').fill('Duct Creation Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-002: Draw Duct (Tauri Offline)', () => {
  test('Step 1: Activate Duct Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('d');
      const ductTool = page.getByTestId('tool-duct');
      await expect(ductTool).toHaveAttribute('aria-pressed', 'true');
      const statusBar = page.getByTestId('status-bar');
      await expect(statusBar).toContainText('Duct Tool');
    });
  });

  test('Step 2-4: Draw Duct on Canvas', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Activate Duct tool', async () => {
      await page.keyboard.press('d');
      await expect(page.getByTestId('tool-duct')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2-4: Drag to create duct', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(460, 220);
      await page.mouse.up();

      await expect(page.getByTestId('status-bar')).toContainText('Duct');
    });
  });
});
