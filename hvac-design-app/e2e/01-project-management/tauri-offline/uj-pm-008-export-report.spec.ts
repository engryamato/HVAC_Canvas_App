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
        // Add listeners for other fs commands to prevent hanging
        if (cmd === 'plugin:fs|read_text_file') {
           // Return empty JSON object if reading project file fails, or specific content
           return mock.files[args?.path] ?? '{}';
        }
        if (cmd === 'plugin:fs|exists') {
           return true; 
        }
        return null;
      },
    };
  }, { savePath: options?.savePath ?? 'C:/Users/Test/Documents/Exports/Project_Report.pdf' });
}

async function seedProjectState(page: Page) {
  const project = {
    projectId: 'proj-export-001', // Changed from id
    projectName: 'Export Project', // Changed from name
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
    entities: { byId: {}, allIds: [] },
    version: '1.0.0'
  };

  const projectFileContent = JSON.stringify(project);
  const filePath = 'project-proj-export-001';

  await page.addInitScript(({ project, projectFileContent, filePath }) => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectDetails', JSON.stringify({
      state: {
        projects: [{
             id: project.projectId, // Map back to internal store "id"
             name: project.projectName, // Map back to internal store "name"
             ...project
        }]
      },
      version: 0,
    }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: [{
          projectId: project.projectId,
          projectName: project.projectName,
          projectNumber: project.projectNumber,
          clientName: project.clientName,
          entityCount: 0,
          createdAt: project.createdAt,
          modifiedAt: project.modifiedAt,
          storagePath: filePath,
          isArchived: false,
        }],
        recentProjectIds: [project.projectId], // Use projectId
        loading: false,
      },
      version: 0,
    }));

    // Populate mock files for Tauri fs read
    if ((window as any).__TAURI_MOCK__) {
       (window as any).__TAURI_MOCK__.files[filePath] = projectFileContent;
    }
  }, { project, projectFileContent, filePath });
}

test.describe('UJ-PM-008: Export Project Report (Tauri Offline)', () => {
  test('Export dialog opens and triggers native save', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjectState(page);
    page.on('console', msg => console.log(`BROWSER MSG: ${msg.text()}`));
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/canvas/proj-export-001');
    await expect(page.getByTestId('header')).toBeVisible();

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByTestId('menu-export-report').click();

    await expect(page.getByTestId('export-report-dialog')).toBeVisible();

    await page.getByTestId('report-type-select').selectOption('full');
    await page.getByTestId('orientation-select').selectOption('landscape');

    // Force click to bypass any overlay/animation issues
    await page.getByTestId('export-btn').dispatchEvent('click');

    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const saveCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:dialog|save');
    const writeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|write_binary_file');

    expect(saveCalls.length).toBeGreaterThan(0);
    expect(writeCalls.length).toBeGreaterThan(0);
  });
});
