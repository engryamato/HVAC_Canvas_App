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

function createProjectFile(projectId: string, projectName: string, filePath: string) {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0.0',
    projectId,
    projectName,
    projectNumber: 'PM-3',
    clientName: 'Acme Corp',
    location: '123 Main St, Chicago, IL',
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

async function seedDashboardProject(page: Page, projectId: string, projectName: string, filePath: string) {
  await page.addInitScript((proj) => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: [{
          projectId: proj.projectId,
          projectName: proj.projectName,
          projectNumber: 'PM-3',
          clientName: 'Acme Corp',
          entityCount: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          storagePath: proj.filePath,
          filePath: proj.filePath,
          isArchived: false,
        }],
        recentProjectIds: [proj.projectId],
        loading: false,
      },
      version: 0,
    }));

    // Seed sws.projectDetails for useProjectStore (needed for Edit Dialog)
    // Map to Project interface used by useProjectStore
    const projectDetail = {
      id: proj.projectId,
      name: proj.projectName,
      projectNumber: 'PM-3',
      clientName: 'Acme Corp',
      location: '123 Main St, Chicago, IL',
      scope: { details: ['HVAC'], materials: [], projectType: 'Commercial' },
      siteConditions: { elevation: '0', outdoorTemp: '70', indoorTemp: '70', windSpeed: '0', humidity: '50', localCodes: '' },
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      entityCount: 0,
      isArchived: false,
      version: '1.0.0'
    };
    
    localStorage.setItem('sws.projectDetails', JSON.stringify({
      state: { projects: [projectDetail] },
      version: 0
    }));
  }, { projectId, projectName, filePath });
}

test.describe('UJ-PM-003: Edit Project Metadata (Tauri Offline)', () => {
  test('Edit dialog saves metadata and persists to disk', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/EditProject.sws';
    const projectId = 'proj-edit-001';
    const projectName = 'Edit Project';
    const projectFile = createProjectFile(projectId, projectName, filePath);

    await enableTauriMock(page, { files: { [filePath]: JSON.stringify(projectFile) } });
    await seedDashboardProject(page, projectId, projectName, filePath);

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await page.getByTestId('project-card-menu-btn').first().click();
    await page.getByTestId('menu-edit-btn').click();

    await expect(page.getByTestId('edit-project-dialog')).toBeVisible();

    await page.getByTestId('edit-project-name-input').fill('Edited Project');
    await page.getByTestId('edit-project-number-input').fill('PM-3-UPDATED');
    await page.getByTestId('edit-client-name-input').fill('Updated Client');
    await page.getByTestId('edit-location-input').fill('456 State St');

    await page.getByTestId('edit-save-btn').click();

    await expect(page.getByText('Edited Project')).toBeVisible();

    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const writeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|write_text_file');
    expect(writeCalls.length).toBeGreaterThan(0);
  });
});
