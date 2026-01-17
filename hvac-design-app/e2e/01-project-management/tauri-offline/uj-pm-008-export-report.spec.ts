import { test, expect, type Page } from '@playwright/test';

async function enableTauriMock(page: Page, options?: { savePath?: string }) {
  await page.addInitScript(({ savePath }) => {
    const mock = {
      files: {} as Record<string, string>,
      calls: [] as Array<{ cmd: string; args?: any }>,
      savePath: savePath || 'C:/Users/Test/Documents/Exports/Project_Report.pdf',
    };

    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_MOCK__ = mock;
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        mock.calls.push({ cmd, args });
        if (cmd === 'plugin:dialog|save') {
          return mock.savePath;
        }
        if (cmd === 'plugin:fs|write_binary_file') {
          mock.files[(args?.path as string) || ''] = 'binary';
          return null;
        }
        return null;
      },
    };
  }, { savePath: options?.savePath ?? 'C:/Users/Test/Documents/Exports/Project_Report.pdf' });
}

async function seedProjectState(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('project-storage', JSON.stringify({
      state: {
        projects: [{
          id: 'proj-export-001',
          name: 'Export Project',
          projectNumber: 'EX-1',
          clientName: 'Export Client',
          location: 'Export St',
          scope: { details: ['HVAC'], materials: [], projectType: 'Commercial' },
          siteConditions: { elevation: '0', outdoorTemp: '70', indoorTemp: '70', windSpeed: '0', humidity: '50', localCodes: '' },
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          entityCount: 0,
          thumbnailUrl: null,
          isArchived: false,
          entities: []
        }]
      },
      version: 0,
    }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: [{
          projectId: 'proj-export-001',
          projectName: 'Export Project',
          projectNumber: 'EX-1',
          clientName: 'Export Client',
          entityCount: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          storagePath: 'project-proj-export-001',
          isArchived: false,
        }],
        recentProjectIds: ['proj-export-001'],
        loading: false,
      },
      version: 0,
    }));
  });
}

test.describe('UJ-PM-008: Export Project Report (Tauri Offline)', () => {
  test('Export dialog opens and triggers native save', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjectState(page);

    await page.goto('/canvas/proj-export-001');
    await expect(page.getByTestId('header')).toBeVisible();

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByTestId('menu-export-report').click();

    await expect(page.getByTestId('export-report-dialog')).toBeVisible();

    await page.getByTestId('report-type-select').selectOption('full');
    await page.getByTestId('orientation-select').selectOption('landscape');

    await page.getByTestId('export-btn').click();

    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const saveCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:dialog|save');
    const writeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|write_binary_file');

    expect(saveCalls.length).toBeGreaterThan(0);
    expect(writeCalls.length).toBeGreaterThan(0);
  });
});
