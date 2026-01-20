import { test, expect } from '@playwright/test';
import { openCanvas } from '../../utils/test-utils';

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



test.describe('UJ-EC-006: Draw Fitting (Wye/Tee) (Tauri Offline)', () => {
  test('Step 1: Select Fitting Type', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Wye Fitting Project');
    });

    await test.step('Step 1: Activate fitting tool and select tee', async () => {
      await page.keyboard.press('f');
      await expect(page.getByTestId('tool-fitting')).toHaveAttribute('aria-pressed', 'true');
      
      // Select Tee
      await expect(page.getByTestId('fitting-type-selector')).toBeVisible();
      await page.getByTestId('fitting-type-tee').click();
      await expect(page.getByTestId('fitting-type-tee')).toHaveAttribute('aria-pressed', 'true');
      
      // Status bar might just show "Fitting Tool" unless we update it to show type
      await expect(page.getByTestId('status-bar')).toContainText('Fitting');
    });
  });

  test('Step 2: Position and place fitting', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Wye Fitting Project');
    });

    await test.step('Place wye fitting', async () => {
      await page.keyboard.press('f');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(320, 240);
    });
  });
});
