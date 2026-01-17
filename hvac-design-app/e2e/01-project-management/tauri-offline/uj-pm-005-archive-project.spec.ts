import { test, expect, type Page } from '@playwright/test';

async function enableTauriMock(page: Page, options?: { files?: Record<string, string> }) {
  await page.addInitScript(({ files }) => {
    const mock = {
      files: (files || {}) as Record<string, string>,
      calls: [] as Array<{ cmd: string; args?: any }>,
    };

    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_MOCK__ = mock;
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        mock.calls.push({ cmd, args });
        if (cmd === 'plugin:fs|read_text_file') {
          return mock.files[args?.path] ?? '';
        }
        if (cmd === 'plugin:fs|write_text_file') {
          mock.files[(args?.path as string) || ''] = String(args?.contents ?? '');
          return null;
        }
        if (cmd === 'plugin:fs|exists') {
          return Object.prototype.hasOwnProperty.call(mock.files, args?.path);
        }
        return null;
      },
    };
  }, { files: options?.files ?? {} });
}

function createProjectFile(projectId: string, projectName: string) {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0.0',
    projectId,
    projectName,
    projectNumber: 'AR-1',
    clientName: 'Archive Client',
    location: 'Archive St',
    scope: { details: ['HVAC'], materials: [], projectType: 'Commercial' },
    siteConditions: { elevation: '0', outdoorTemp: '70', indoorTemp: '70', windSpeed: '0', humidity: '50', localCodes: '' },
    createdAt: now,
    modifiedAt: now,
    isArchived: false,
    entities: { byId: {}, allIds: [] },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true },
    thumbnailUrl: null,
    version: '1.0.0',
  };
}

async function seedProjects(page: Page, projects: Array<{ id: string; name: string; filePath: string; archived?: boolean }>) {
  await page.addInitScript((items) => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: items.map((item: any) => ({
          projectId: item.id,
          projectName: item.name,
          projectNumber: 'AR-1',
          clientName: 'Archive Client',
          entityCount: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          storagePath: item.filePath,
          filePath: item.filePath,
          isArchived: item.archived ?? false,
        })),
        recentProjectIds: items.filter((item: any) => !item.archived).map((item: any) => item.id),
        loading: false,
      },
      version: 0,
    }));
  }, projects);
}

test.describe('UJ-PM-005: Archive Project (Tauri Offline)', () => {
  test('Archive moves project to archived tab and writes file', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/ArchiveMe.sws';
    const projectFile = createProjectFile('proj-archive-001', 'Project to Archive');

    await enableTauriMock(page, { files: { [filePath]: JSON.stringify(projectFile) } });
    await seedProjects(page, [{ id: 'proj-archive-001', name: 'Project to Archive', filePath }]);

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await page.getByTestId('project-card-menu-btn').first().click();
    await page.getByTestId('menu-archive-btn').click();

    await expect(page.getByTestId('tab-archived')).toBeVisible();
    await page.getByTestId('tab-archived').click();

    await expect(page.getByText('Project to Archive')).toBeVisible();

    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const writeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|write_text_file');
    expect(writeCalls.length).toBeGreaterThan(0);
  });

  test('Restore returns project to active list', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/Archived.sws';
    const projectFile = createProjectFile('proj-archive-002', 'Archived Project');
    projectFile.isArchived = true;

    await enableTauriMock(page, { files: { [filePath]: JSON.stringify(projectFile) } });
    await seedProjects(page, [{ id: 'proj-archive-002', name: 'Archived Project', filePath, archived: true }]);

    await page.goto('/dashboard');
    await page.getByTestId('tab-archived').click();
    await expect(page.getByText('Archived Project')).toBeVisible();

    await page.getByTestId('project-card-menu-btn').first().click();
    await page.getByTestId('menu-restore-btn').click();

    await page.getByTestId('tab-active').click();
    await expect(page.getByText('Archived Project')).toBeVisible();
  });
});
