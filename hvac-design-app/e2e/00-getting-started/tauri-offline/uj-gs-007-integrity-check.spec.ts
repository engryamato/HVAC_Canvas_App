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

async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function setStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(([k, v]) => {
    localStorage.setItem(k, v);
  }, [key, value]);
}

test.describe('UJ-GS-007: Integrity Check (Tauri Offline)', () => {
  test.beforeEach(async ({ page }) => {
    await enableTauriMock(page);
  });

  test('Startup handles clean localStorage', async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.reload();

    await expect(page.getByTestId('app-logo')).toBeVisible();
    await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible();
  });

  test('Corrupted preferences reset to defaults', async ({ page }) => {
    await page.goto('/');
    await setStorageItem(page, 'sws.preferences', '{ invalid json');
    await page.reload();

    await expect(page.getByTestId('app-logo')).toBeVisible();
  });

  test('Corrupted app state triggers first launch', async ({ page }) => {
    await page.goto('/');
    await setStorageItem(page, 'hvac-app-storage', 'not-valid-json');
    await page.reload();

    await expect(page.getByTestId('app-logo')).toBeVisible();
    await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible();
  });

  test('Backup recovery shows toast on canvas load', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
      localStorage.setItem('hvac-backup-recovered', 'true');
    });

    await page.goto('/canvas/backup-project');
    await expect(page.getByText('Backup loaded')).toBeVisible({ timeout: 5000 });
  });

  test('Tauri file system check attempts document directory access', async ({ page }) => {
    await page.goto('/');
    await page.reload();

    const invokeCalls = await page.evaluate(() => {
      return (window as any).__TAURI_MOCK__?.calls || [];
    });

    const hasDocumentDirCall = invokeCalls.some((call: any) => call.cmd === 'plugin:path|resolve_directory');
    expect(hasDocumentDirCall).toBe(true);
  });
});
