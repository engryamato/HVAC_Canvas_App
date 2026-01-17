import { test, expect, type Page } from '@playwright/test';

const DEFAULT_DOCS_DIR = 'C:/Users/Test/Documents/';

async function enableTauriMock(page: Page, options?: { documentDir?: string }) {
  await page.addInitScript(({ documentDir }) => {
    const mock = {
      files: {} as Record<string, string>,
      calls: [] as Array<{ cmd: string; args?: any }>,
      openPath: null as string | null,
      savePath: null as string | null,
      documentDir: documentDir || 'C:/Users/Test/Documents/',
    };

    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_MOCK__ = mock;
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        mock.calls.push({ cmd, args });
        if (cmd === 'plugin:path|resolve_directory') {
          return mock.documentDir;
        }
        return null;
      }
    };
  }, { documentDir: options?.documentDir ?? DEFAULT_DOCS_DIR });
}

async function simulateFirstLaunch(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

test.describe('UJ-GS-001: First Launch Experience (Tauri Offline)', () => {
  test.beforeEach(async ({ page }) => {
    await enableTauriMock(page);
    await simulateFirstLaunch(page);
  });

  test('Flow 1: Complete onboarding journey (tutorial path)', async ({ page }) => {
    await page.goto('/');

    const splash = page.getByTestId('splash-screen');
    try {
      await expect(splash).toBeVisible({ timeout: 2000 });
    } catch {
    }

    await expect(page.getByTestId('app-logo')).toBeVisible();
    await expect(splash).not.toBeVisible({ timeout: 6000 });

    await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('start-tutorial-btn').click();

    const tutorial = page.getByTestId('tutorial-overlay');
    await expect(tutorial).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Equipment Placement')).toBeVisible();

    await tutorial.getByTestId('tutorial-next-btn').click();
    await expect(page.getByText('Duct Connection')).toBeVisible();

    await tutorial.getByTestId('tutorial-next-btn').click();
    await expect(page.getByText('Properties Panel')).toBeVisible();

    await tutorial.getByTestId('tutorial-next-btn').click();
    await expect(page.getByText('Canvas Navigation')).toBeVisible();

    await tutorial.getByTestId('tutorial-next-btn').click();
    await expect(page.getByText('Help Access')).toBeVisible();

    await tutorial.getByTestId('tutorial-next-btn').click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
  });

  test('Flow 2: Fast track (skip tutorial)', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('app-logo')).toBeVisible();
    await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 6000 });

    await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible();
    await page.getByTestId('skip-tutorial-btn').click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
  });
});
