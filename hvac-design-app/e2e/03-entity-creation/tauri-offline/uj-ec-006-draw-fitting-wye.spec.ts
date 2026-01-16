import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Draw Fitting (Wye/Tee) (UJ-EC-006)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-006-DrawFittingWye.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-006-DrawFittingWye.md
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
    await page.getByTestId('project-name-input').fill('Wye Fitting Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-006: Draw Fitting (Wye/Tee) (Tauri Offline)', () => {
  test('Step 1: Select Fitting Type', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate fitting tool and select wye', async () => {
      await page.keyboard.press('f');
      await expect(page.getByTestId('tool-fitting')).toHaveAttribute('aria-pressed', 'true');
      await page.getByText('Wye', { exact: false }).click();
      await expect(page.getByTestId('status-bar')).toContainText('Fitting');
    });
  });

  test('Step 2: Position and place fitting', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Place wye fitting', async () => {
      await page.keyboard.press('f');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(320, 240);
    });
  });
});
