import { test, expect, type Page } from '@playwright/test';

async function enableTauriMock(page: Page, options?: { documentDir?: string }) {
  await page.addInitScript(({ documentDir }) => {
    const mock = {
      calls: [] as Array<{ cmd: string; args?: any }>,
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
      },
    };
  }, { documentDir: options?.documentDir ?? 'C:/Users/Test/Documents/' });
}

async function markHasLaunched(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({
      state: { hasLaunched: true },
      version: 0,
    }));
  });
}

test.describe('UJ-GS-006: Environment Detection (Tauri Offline)', () => {
  test.beforeEach(async ({ page }) => {
    await enableTauriMock(page);
  });

  test('Detects Tauri runtime via window.__TAURI__', async ({ page }) => {
    await page.goto('/');

    const isTauri = await page.evaluate(() => {
      return typeof window !== 'undefined' && '__TAURI__' in window;
    });

    expect(isTauri).toBe(true);
  });

  test('Dashboard uses disk scan when Tauri is detected', async ({ page }) => {
    await markHasLaunched(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });

    const invokeCalls = await page.evaluate(() => {
      return (window as any).__TAURI_MOCK__?.calls || [];
    });

    const hasDocumentDirCall = invokeCalls.some((call: any) => call.cmd === 'plugin:path|resolve_directory');
    expect(hasDocumentDirCall).toBe(true);
  });

  test('Tauri-only actions are exposed on dashboard', async ({ page }) => {
    await markHasLaunched(page);
    await page.goto('/dashboard');

    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /rescan/i })).toBeVisible();
  });
});
