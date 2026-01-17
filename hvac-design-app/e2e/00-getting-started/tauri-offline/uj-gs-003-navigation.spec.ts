import { test, expect, type Page } from '@playwright/test';

async function enableTauriMock(page: Page) {
  await page.addInitScript(() => {
    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async () => null,
    };
  });
}

async function ensureLaunched(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({
      state: { hasLaunched: true },
      version: 0,
    }));
  });
}

async function ensureProjectExists(page: Page) {
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

    await expect(page.getByTestId('new-project-dialog')).toBeVisible();
    await page.getByTestId('project-name-input').fill('Navigation Test Project');
    await page.getByTestId('create-button').click();
    await expect(page).toHaveURL(/\/canvas\//);

    await page.getByTestId('breadcrumb-dashboard').click();
    await expect(page).toHaveURL('/dashboard');
  }
}

test.describe('UJ-GS-003: Navigation and Interface Overview (Tauri Offline)', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    await enableTauriMock(page);
    await ensureLaunched(page);
    await ensureProjectExists(page);
  });

  test('Layout regions visible on canvas', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await expect(page.getByTestId('header')).toBeVisible();
    await expect(page.getByTestId('toolbar')).toBeVisible();
    await expect(page.getByTestId('left-sidebar')).toBeVisible();
    await expect(page.getByTestId('canvas-area')).toBeVisible();
    await expect(page.getByTestId('right-sidebar')).toBeVisible();
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });

  test('Navigate Dashboard -> Canvas -> Dashboard via breadcrumb', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await page.getByTestId('breadcrumb-dashboard').click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('Navigate to Dashboard via File menu', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByTestId('menu-dashboard').click();

    await expect(page).toHaveURL('/dashboard');
  });

  test('Keyboard shortcut Ctrl+Shift+D navigates to dashboard', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await page.keyboard.press('Control+Shift+D');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Left sidebar tabs and collapse', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await expect(page.getByTestId('tab-equipment')).toBeVisible();
    await expect(page.getByTestId('tab-layers')).toBeVisible();
    await expect(page.getByTestId('tab-recent')).toBeVisible();

    await page.getByTestId('left-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('left-sidebar')).toHaveClass(/collapsed/);

    await page.getByTestId('left-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('left-sidebar')).not.toHaveClass(/collapsed/);
  });

  test('Right sidebar tabs and collapse', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await expect(page.getByTestId('tab-properties')).toBeVisible();
    await expect(page.getByTestId('tab-calculations')).toBeVisible();
    await expect(page.getByTestId('tab-bom')).toBeVisible();
    await expect(page.getByTestId('tab-notes')).toBeVisible();

    await page.getByTestId('right-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('right-sidebar')).toHaveClass(/collapsed/);

    await page.getByTestId('right-sidebar-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('right-sidebar')).not.toHaveClass(/collapsed/);
  });

  test('Equipment search filters items', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await page.getByTestId('equipment-search').fill('AHU');
    await page.waitForTimeout(500);
    await expect(page.getByTestId('equipment-item').first()).toBeVisible();

    await page.getByTestId('equipment-search').clear();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('category-air-handling-units')).toBeVisible();
  });

  test('Toolbar shortcuts activate tools', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    await page.keyboard.press('d');
    await expect(page.getByTestId('tool-duct')).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('r');
    await expect(page.getByTestId('tool-room')).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('v');
    await expect(page.getByTestId('tool-select')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Status bar shows coordinates, zoom, and grid state', async ({ page }) => {
    await page.getByTestId('project-card').first().click();
    await expect(page).toHaveURL(/\/canvas\//);

    const statusBar = page.getByTestId('status-bar');
    await expect(statusBar).toContainText(/X:/i);
    await expect(statusBar).toContainText(/Zoom:/i);
    await expect(statusBar).toContainText(/Grid:/i);
  });
});
