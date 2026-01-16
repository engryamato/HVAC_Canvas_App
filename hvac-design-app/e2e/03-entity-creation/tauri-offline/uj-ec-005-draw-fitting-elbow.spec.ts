import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Draw Fitting (Elbow) (UJ-EC-005)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-005-DrawFittingElbow.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-005-DrawFittingElbow.md
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
    await page.getByTestId('project-name-input').fill('Elbow Fitting Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-005: Draw Fitting (Elbow) (Tauri Offline)', () => {
  test('Step 1: Activate Fitting Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('f');
      const fittingTool = page.getByTestId('tool-fitting');
      await expect(fittingTool).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.fitting-type-selector')).toBeVisible();
      await expect(page.getByTestId('status-bar')).toContainText('Fitting Tool');
    });
  });

  test('Step 2-3: Select elbow type and place fitting', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Activate Fitting tool', async () => {
      await page.keyboard.press('f');
      await expect(page.getByTestId('tool-fitting')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2: Select 90° Long Radius', async () => {
      await page.getByText('Long Radius', { exact: false }).click();
    });

    await test.step('Step 3: Click to place fitting', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(320, 240);
      await expect(page.getByTestId('status-bar')).toContainText('Fitting');
    });
  });
});
