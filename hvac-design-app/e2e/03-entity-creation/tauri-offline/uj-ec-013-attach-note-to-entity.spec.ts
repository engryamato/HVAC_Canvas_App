import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Attach Note to Entity (UJ-EC-013)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-013-AttachNoteToEntity.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-013-AttachNoteToEntity.md
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
    await page.getByTestId('project-name-input').fill('Attach Note Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-013: Attach Note to Entity (Tauri Offline)', () => {
  test('Step 1-4: Attach note to room', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Create room', async () => {
      await page.keyboard.press('r');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(380, 320);
      await page.mouse.up();
    });

    await test.step('Attach note to room', async () => {
      await page.keyboard.press('n');
      await page.mouse.click(240, 240);
      await page.keyboard.type('Supply: 500 CFM');
      await page.mouse.click(100, 100);
    });
  });
});
