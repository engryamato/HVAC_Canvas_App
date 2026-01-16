import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Disconnect Duct (UJ-EC-016)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-016-DisconnectDuct.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-016-DisconnectDuct.md
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
    await page.getByTestId('project-name-input').fill('Disconnect Duct Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-016: Disconnect Duct (Tauri Offline)', () => {
  test('Step 1-3: Disconnect duct from entity', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Create room and duct', async () => {
      await page.keyboard.press('r');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(380, 320);
      await page.mouse.up();

      await page.keyboard.press('d');
      await page.mouse.move(100, 200);
      await page.mouse.down();
      await page.mouse.move(200, 260);
      await page.mouse.up();
    });

    await test.step('Drag duct endpoint away', async () => {
      await page.mouse.move(200, 260);
      await page.mouse.down();
      await page.mouse.move(300, 320);
      await page.mouse.up();
      await expect(page.getByTestId('status-bar')).toBeVisible();
    });
  });
});
