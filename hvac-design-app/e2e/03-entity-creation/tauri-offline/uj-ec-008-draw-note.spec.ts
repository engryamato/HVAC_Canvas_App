import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Draw Note (UJ-EC-008)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-008-DrawNote.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-008-DrawNote.md
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
    await page.getByTestId('project-name-input').fill('Draw Note Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-008: Draw Note (Tauri Offline)', () => {
  test('Step 1: Select Note Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate note tool', async () => {
      await page.keyboard.press('n');
      await expect(page.getByTestId('tool-note')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('status-bar')).toContainText('Note');
    });
  });

  test('Step 2-3: Place note and enter text', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Place note', async () => {
      await page.keyboard.press('n');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.click(420, 320);
      await expect(canvas).toBeVisible();
    });

    await test.step('Type note text', async () => {
      await page.keyboard.type('Install RTU-1 on rooftop');
    });
  });
});
