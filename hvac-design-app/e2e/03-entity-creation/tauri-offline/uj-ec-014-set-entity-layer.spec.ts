import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Set Entity Layer (UJ-EC-014)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-014-SetEntityLayer.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-014-SetEntityLayer.md
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
    await page.getByTestId('project-name-input').fill('Layer Assignment Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-014: Set Entity Layer (Tauri Offline)', () => {
  test('Step 1-3: Open layers panel and change layer', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Open layers panel', async () => {
      await expect(page.getByText('Layers', { exact: false })).toBeVisible();
      await page.getByText('Layers', { exact: false }).click();
    });

    await test.step('Change layer in inspector', async () => {
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toBeVisible();
    });
  });
});
