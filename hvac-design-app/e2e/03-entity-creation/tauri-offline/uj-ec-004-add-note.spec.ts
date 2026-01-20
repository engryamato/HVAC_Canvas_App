import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Add Note (UJ-EC-004)
 *
 * STRICT COMPLIANCE MODE:
 * This test suite mirrors the User Journey Document `UJ-EC-004-AddNote.md` 1:1.
 * Every "Step" in the doc corresponds to a `test.step` here.
 *
 * @spec docs/user-journeys/03-entity-creation/tauri-offline/UJ-EC-004-AddNote.md
 * @mode tauri-offline
 */

import { openCanvas } from '../../utils/test-utils';

test.describe('UJ-EC-004: Add Note (Tauri Offline)', () => {
  test('Step 1: Activate Note Tool', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Note Creation Project');
    });

    await test.step('Step 1: Activate tool via shortcut', async () => {
      await page.keyboard.press('n');
      const noteTool = page.getByTestId('tool-note');
      await expect(noteTool).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('status-bar')).toContainText('Note Tool');
    });
  });

  test('Step 2-4: Place and edit note', async ({ page }) => {
    await test.step('Navigate to Canvas', async () => {
      await openCanvas(page, 'Note Creation Project');
    });

    await test.step('Activate Note tool', async () => {
      await page.keyboard.press('n');
      await expect(page.getByTestId('tool-note')).toHaveAttribute('aria-pressed', 'true');
    });

    await test.step('Step 2: Click to place note', async () => {
      const canvas = page.locator('[data-testid="canvas-area"] canvas');
      await expect(canvas).toBeVisible();
      await page.mouse.click(400, 160);
    });

    await test.step('Step 3: Type note content', async () => {
      await page.keyboard.type('CFM calculation: 300 CFM');
    });

    await test.step('Step 4: Click outside to finish editing', async () => {
      await page.mouse.click(120, 120);
    });
  });
});
