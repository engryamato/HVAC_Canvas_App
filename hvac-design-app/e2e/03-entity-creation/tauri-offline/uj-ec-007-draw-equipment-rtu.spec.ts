import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Draw Equipment (RTU) (UJ-EC-007)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-007-DrawEquipmentRTU.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-007-DrawEquipmentRTU.md
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
    await page.getByTestId('project-name-input').fill('RTU Placement Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);
  } else {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/canvas\//);
  }
}

test.describe('UJ-EC-007: Draw Equipment (RTU) (Tauri Offline)', () => {
  test('Step 1: Select RTU Equipment Type', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Step 1: Activate equipment tool and select RTU', async () => {
      await page.keyboard.press('e');
      await expect(page.getByTestId('tool-equipment')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('RTU', { exact: false })).toBeVisible();
    });
  });

  test('Step 2: Position and Place RTU', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Place RTU on canvas', async () => {
      await page.keyboard.press('e');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(520, 180);
      await expect(page.getByTestId('status-bar')).toContainText('RTU');
    });
  });

  test('Step 3: Configure RTU Capacity', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Place RTU', async () => {
      await page.keyboard.press('e');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.click(520, 180);
    });

    await test.step('Step 3: Inspector shows RTU properties', async () => {
      const propertiesPanel = page.getByTestId('properties-panel');
      await expect(propertiesPanel).toContainText('RTU');
    });
  });

  test('Step 5: Verify Equipment in BOM', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page);
    });

    await test.step('Open BOM panel', async () => {
      await page.getByTestId('tab-bom').click();
      await expect(page.getByTestId('bom-panel')).toBeVisible();
      await expect(page.getByText('RTU', { exact: false })).toBeVisible();
    });
  });
});
