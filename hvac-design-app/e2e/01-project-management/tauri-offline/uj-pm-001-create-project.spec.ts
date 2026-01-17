import { test, expect, type Page } from '@playwright/test';

const DEFAULT_DOCS_DIR = 'C:/Users/Test/Documents/';

async function enableTauriMock(page: Page, options?: { documentDir?: string; savePath?: string | null; writeError?: string }) {
  await page.addInitScript(({ documentDir, savePath, writeError }) => {
    const mock = {
      files: {} as Record<string, string>,
      calls: [] as Array<{ cmd: string; args?: any }>,
      documentDir: documentDir || 'C:/Users/Test/Documents/',
      savePath: savePath ?? 'C:/Users/Test/Documents/HVAC_Projects/Office_Building_HVAC.sws',
      writeError: writeError || null,
    };

    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_MOCK__ = mock;
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        mock.calls.push({ cmd, args });
        if (cmd === 'plugin:path|resolve_directory') {
          return mock.documentDir;
        }
        if (cmd === 'plugin:dialog|save') {
          return mock.savePath;
        }
        if (cmd === 'plugin:fs|write_text_file') {
          if (mock.writeError) {
            throw new Error(mock.writeError);
          }
          mock.files[(args?.path as string) || ''] = String(args?.contents ?? '');
          return null;
        }
        if (cmd === 'plugin:fs|exists') {
          return Object.prototype.hasOwnProperty.call(mock.files, args?.path);
        }
        if (cmd === 'plugin:fs|read_text_file') {
          return mock.files[args?.path] ?? '';
        }
        return null;
      },
    };
  }, {
    documentDir: options?.documentDir ?? DEFAULT_DOCS_DIR,
    savePath: options?.savePath ?? 'C:/Users/Test/Documents/HVAC_Projects/Office_Building_HVAC.sws',
    writeError: options?.writeError ?? null,
  });
}

async function markHasLaunched(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({
      state: { hasLaunched: true },
      version: 0,
    }));
  });
}

test.describe('UJ-PM-001: Create New Project (Tauri Offline)', () => {
  test.beforeEach(async ({ page }) => {
    await enableTauriMock(page);
    await markHasLaunched(page);
    await page.goto('/dashboard');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    });
    await page.reload();
  });

  test('Strict flow: Create project with metadata and file persistence', async ({ page }) => {
    await page.getByTestId('empty-state-create-btn').click();

    await expect(page.getByTestId('new-project-dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible();

    const scopeTrigger = page.getByRole('button', { name: 'Project Scope' });
    await scopeTrigger.click();

    await expect(page.locator('#scope-hvac')).toBeVisible();
    await expect(page.locator('#scope-hvac')).toHaveAttribute('data-state', 'checked');

    await expect(page.getByTestId('create-button')).toBeDisabled();

    await page.getByTestId('project-name-input').fill('Office Building HVAC');
    await expect(page.getByTestId('create-button')).toBeEnabled();
    await expect(page.getByText('20/100')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Galvanized Steel' }).click();
    await page.getByLabel('Galvanized Steel Grade').click();
    await page.getByRole('option', { name: 'G-90' }).click();

    await page.getByRole('checkbox', { name: 'Stainless Steel' }).click();
    await page.getByLabel('Stainless Steel Grade').click();
    await page.getByRole('option', { name: '304 S.S.' }).click();

    await page.getByRole('combobox', { name: 'Project Type' }).click();
    await page.getByRole('option', { name: 'Commercial' }).click();

    const siteConditionsTrigger = page.getByRole('button', { name: 'Site Conditions' });
    await siteConditionsTrigger.click();

    await page.getByLabel('Elevation (ft)').fill('650');
    await page.getByLabel('Outdoor Temp (°F)').fill('95');
    await page.getByLabel('Indoor Temp (°F)').fill('72');
    await page.getByLabel('Wind Speed (mph)').fill('15');
    await page.getByLabel('Humidity (%)').fill('45');
    await page.getByLabel('Local Codes').fill('IMC 2021, ASHRAE 62.1');

    await page.getByTestId('create-button').click();

    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await expect(page.getByTestId('header')).toBeVisible();

    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const writeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|write_text_file');
    expect(writeCalls.length).toBeGreaterThan(0);

    const filePaths = writeCalls.map((call: any) => call.args?.path).filter(Boolean) as string[];
    const hasPrimary = filePaths.some((path) => path.endsWith('.sws'));
    const hasBackup = filePaths.some((path) => path.endsWith('.sws.bak'));

    expect(hasPrimary).toBe(true);
    expect(hasBackup).toBe(true);
  });

  test('Edge case: Name too long is truncated to 100 characters', async ({ page }) => {
    await page.getByTestId('empty-state-create-btn').click();
    const longName = 'A'.repeat(101);
    await page.getByTestId('project-name-input').fill(longName);
    await expect(page.getByText('100/100')).toBeVisible();

    const val = await page.getByTestId('project-name-input').inputValue();
    expect(val.length).toBe(100);
  });

  test('Edge case: Save dialog cancelled keeps dialog open', async ({ page }) => {
    await enableTauriMock(page, { savePath: null });
    await page.reload();

    await page.getByTestId('empty-state-create-btn').click();
    await page.getByTestId('project-name-input').fill('Cancelled Project');
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('new-project-dialog')).toBeVisible();
    await expect(page.getByTestId('create-button')).toBeEnabled();
  });

  test('Edge case: File write failure shows alert and preserves form', async ({ page }) => {
    const messages: string[] = [];
    page.on('dialog', async (dialog) => {
      messages.push(dialog.message());
      await dialog.dismiss();
    });

    await enableTauriMock(page, { writeError: 'permission denied' });
    await page.reload();

    await page.getByTestId('empty-state-create-btn').click();
    await page.getByTestId('project-name-input').fill('Permission Error Project');
    await page.getByTestId('create-button').click();

    await expect(page.getByTestId('new-project-dialog')).toBeVisible();
    await expect(page.getByTestId('project-name-input')).toHaveValue('Permission Error Project');

    expect(messages.some((message) => message.includes('Failed to save project'))).toBe(true);
  });
});
