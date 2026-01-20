import { test, expect } from '@playwright/test';
import { openCanvas } from '../../utils/test-utils';

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

test.describe('UJ-EC-005: Draw Fitting (Elbow) (Tauri Offline)', () => {
  test('Step 1: Activate Fitting Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Elbow Fitting Project');
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
      await openCanvas(page, 'Elbow Fitting Project');
    });

    await test.step('Activate Fitting tool', async () => {
      await page.keyboard.press('f');
      await expect(page.getByTestId('tool-fitting')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2: Select 90° Elbow', async () => {
      // Wait for fitting type selector to be visible
      await expect(page.getByTestId('fitting-type-selector')).toBeVisible();
      
      // Click Elbow 90° button in type selector
      await page.getByTestId('fitting-type-elbow_90').click();
      
      // Verify elbow_90 is selected
      await expect(page.getByTestId('fitting-type-elbow_90')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 3: Click to place fitting', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(320, 240);
      await expect(page.getByTestId('status-bar')).toContainText('Fitting');
    });
  });
});
