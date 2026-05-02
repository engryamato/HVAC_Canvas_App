import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const axeSource = readFileSync(path.resolve(__dirname, '../../node_modules/axe-core/axe.min.js'), 'utf8');

async function openCatalogReview(
  page: Parameters<typeof test>[0]['page'],
  options: { resetStorage?: boolean } = {}
) {
  await page.goto('/ux-review/catalog');
  if (options.resetStorage) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  }
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('catalog-review-frame')).toBeVisible();
}

async function setReviewFrameWidth(page: Parameters<typeof test>[0]['page'], width: number) {
  await page.getByTestId('catalog-review-frame').evaluate((node, nextWidth) => {
    (node as HTMLElement).style.width = `${nextWidth}px`;
  }, width);
}

test.describe('Compact catalog rollout', () => {
  test('defaults to compact density, shows 10+ visible rows at 300px, and persists density changes', async ({ page }) => {
    await openCatalogReview(page, { resetStorage: true });
    await setReviewFrameWidth(page, 300);

    const compactButton = page.getByRole('button', { name: 'compact' });
    const comfortableButton = page.getByRole('button', { name: 'comfortable' });
    await expect(compactButton).toHaveAttribute('aria-pressed', 'true');

    const visibleRowCount = await page.getByTestId('catalog-entry-list').evaluate((list) => {
      const listRect = list.getBoundingClientRect();
      const rowButtons = Array.from(
        list.querySelectorAll<HTMLElement>('[data-catalog-row-trigger="true"]')
      );

      return rowButtons.filter((row) => {
        const rect = row.getBoundingClientRect();
        return rect.top >= listRect.top && rect.bottom <= listRect.bottom;
      }).length;
    });
    expect(visibleRowCount).toBeGreaterThanOrEqual(10);

    await comfortableButton.click();
    await expect(comfortableButton).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'comfortable' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'compact' }).click();
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'compact' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('supports keyboard row navigation and closes context menus on escape', async ({ page }) => {
    await openCatalogReview(page, { resetStorage: true });

    const firstRow = page.getByTestId('catalog-row-trigger-round-duct');
    const secondRow = page.getByTestId('catalog-row-trigger-rect-duct');

    await firstRow.focus();
    await page.keyboard.press('ArrowDown');
    await expect(secondRow).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(firstRow).toBeFocused();

    await page.getByRole('button', { name: 'Open actions for Round Duct' }).click();
    await expect(page.getByTestId('catalog-row-actions-menu-round-duct')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('catalog-row-actions-menu-round-duct')).toBeHidden();
    await expect(firstRow).toBeFocused();
  });

  test('matches compact, comfortable, and narrow-width catalog baselines', async ({ page }) => {
    await openCatalogReview(page, { resetStorage: true });

    const frame = page.getByTestId('catalog-review-frame');

    await setReviewFrameWidth(page, 300);
    await expect(frame).toHaveScreenshot('catalog-compact-300px.png');

    await page.getByRole('button', { name: 'comfortable' }).click();
    await expect(frame).toHaveScreenshot('catalog-comfortable-300px.png');

    await page.getByRole('button', { name: 'compact' }).click();
    await setReviewFrameWidth(page, 250);
    await expect(frame).toHaveScreenshot('catalog-compact-250px.png');
  });

  test('has no axe serious or critical violations in the catalog panel', async ({ page }) => {
    await openCatalogReview(page, { resetStorage: true });

    await page.addScriptTag({ content: axeSource });
    const axeResults = await page.evaluate(async () => {
      const panel = document.querySelector('[data-testid="catalog-panel"]');
      const axe = (window as Window & { axe?: { run: (node: Element, options?: object) => Promise<unknown> } }).axe;
      if (!panel || !axe) {
        throw new Error('Catalog panel or axe runtime is unavailable');
      }

      return axe.run(panel, {
        resultTypes: ['violations'],
      });
    });

    const blockingViolations = axeResults.violations.filter(
      (violation: { impact?: string | null }) =>
        violation.impact === 'serious' || violation.impact === 'critical'
    );

    expect(blockingViolations).toEqual([]);
  });
});
