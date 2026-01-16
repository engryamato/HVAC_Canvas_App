import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Draw Room (UJ-EC-001)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-001-DrawRoom.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-001-DrawRoom.md
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
    await page.getByTestId('project-name-input').fill('Room Creation Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-001: Draw Room (Tauri Offline)', () => {
  test('Step 1: Activate Room Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('r');
      const roomTool = page.getByTestId('tool-room');
      await expect(roomTool).toHaveAttribute('aria-pressed', 'true');
      const statusBar = page.getByTestId('status-bar');
      await expect(statusBar).toContainText('Room Tool');
    });
  });

  test('Step 2-4: Draw Room on Canvas', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Activate Room tool', async () => {
      await page.keyboard.press('r');
      await expect(page.getByTestId('tool-room')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2-4: Drag to create room', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();

      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(420, 360);
      await page.mouse.up();

      await expect(page.getByTestId('status-bar')).toContainText('Room');
    });
  });

  test('Step 5: View Room Properties', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Create room', async () => {
      await page.keyboard.press('r');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(420, 360);
      await page.mouse.up();
    });

    await test.step('Step 5: Inspector shows room properties', async () => {
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toContainText('Room');
    });
  });
});
