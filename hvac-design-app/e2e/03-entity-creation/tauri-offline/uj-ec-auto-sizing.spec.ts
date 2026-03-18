import { test, expect } from '@playwright/test';
import { ensurePropertiesPanelVisible, openCanvas } from '../../utils/test-utils';

test.describe('UJ-EC: Auto-Sizing (Tauri Offline)', () => {
  test('Auto-sizing suggests sizes and applies the first option', async ({ page }) => {
    await openCanvas(page, 'Auto Sizing Project');

    const canvas = page.locator('[data-testid="canvas-area"] canvas');
    await expect(canvas).toBeVisible();

    await page.keyboard.press('d');
    await page.mouse.move(200, 220);
    await page.mouse.down();
    await page.mouse.move(460, 220);
    await page.mouse.up();
    await page.waitForTimeout(500);

    await page.keyboard.press('v');
    await page.mouse.click(330, 220);
    await ensurePropertiesPanelVisible(page);

    const airflowInput = page.getByLabel('Airflow (CFM)');
    const diameterInput = page.getByLabel('Diameter (in)');
    const startingDiameter = await diameterInput.inputValue();

    await airflowInput.fill('2000');
    await page.getByTestId('calculate-optimal-size').click();

    const firstOption = page.getByTestId('size-option-1');
    await expect(firstOption).toBeVisible();

    const firstOptionText = await firstOption.textContent();
    await firstOption.click();

    await expect(page.getByTestId('size-option-1')).toBeHidden();
    expect(await diameterInput.inputValue()).not.toBe(startingDiameter);
    if (firstOptionText) {
      await expect(page.getByTestId('duct-inspector')).toContainText(firstOptionText.replace('Warning: ', '').split('\n')[0]);
    }
  });
});
