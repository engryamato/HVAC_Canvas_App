import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Place Equipment (UJ-EC-003)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-003-PlaceEquipment.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-003-PlaceEquipment.md
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
    await page.getByTestId('project-name-input').fill('Equipment Placement Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-003: Place Equipment (Tauri Offline)', () => {
  test('Step 1: Activate Equipment Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('e');
      const equipmentTool = page.getByTestId('tool-equipment');
      await expect(equipmentTool).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.equipment-type-selector')).toBeVisible();
      await expect(page.getByTestId('status-bar')).toContainText('Equipment Tool');
    });
  });

  test('Step 2-4: Select and place equipment', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Activate Equipment tool', async () => {
      await page.keyboard.press('e');
      await expect(page.getByTestId('tool-equipment')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2: Select Furnace', async () => {
      await page.getByText('Furnace', { exact: false }).click();
      await expect(page.getByTestId('status-bar')).toContainText('Furnace');
    });

    await test.step('Step 3-4: Click to place equipment', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(320, 240);
      await expect(page.getByTestId('status-bar')).toContainText('Furnace');
    });
  });

  test('Step 5: Configure Equipment Properties', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Place equipment', async () => {
      await page.keyboard.press('e');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.click(320, 240);
    });

    await test.step('Step 5: Inspector shows equipment properties', async () => {
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toContainText('Equipment');
    });
  });
});
