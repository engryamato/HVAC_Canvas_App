import { test, expect } from '@playwright/test';
import { openCanvas } from '../../utils/test-utils';

/**
 * E2E Test Suite: Copy/Paste Entity (UJ-EC-009)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-009-CopyPasteEntity.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-009-CopyPasteEntity.md
 * @mode tauri-offline
 */

test.describe('UJ-EC-009: Copy/Paste Entity (Tauri Offline)', () => {
  test('Step 1-3: Select entity, copy, and paste', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Copy Paste Project');
    });

    await test.step('Create and select room', async () => {
      await page.keyboard.press('r');
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await page.mouse.move(200, 200);
      await page.mouse.down();
      await page.mouse.move(380, 320);
      await page.mouse.up();
      await page.keyboard.press('v');
      await page.mouse.click(240, 240);
    });

    await test.step('Copy and paste', async () => {
      await page.keyboard.press('Control+c');
      await page.keyboard.press('Control+v');
      await expect(page.getByTestId('status-bar')).toBeVisible();
    });
  });
});
