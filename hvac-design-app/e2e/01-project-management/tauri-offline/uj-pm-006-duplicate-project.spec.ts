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
    projectNumber: 'DP-1',
    clientName: 'Duplicate Client',
    location: 'Duplicate St',
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

async function seedProjects(page: Page, project: { id: string; name: string; filePath: string }) {
  await page.addInitScript((item) => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: [{
          projectId: item.id,
          projectName: item.name,
          projectNumber: 'DP-1',
          clientName: 'Duplicate Client',
          entityCount: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          storagePath: item.filePath,
          filePath: item.filePath,
          isArchived: false,
        }],
        recentProjectIds: [item.id],
        loading: false,
      },
      version: 0,
    }));
  }, project);
}

test.describe('UJ-PM-006: Duplicate Project (Tauri Offline)', () => {
  test('Duplicate creates a new project file and correctly suffixes names', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/Original.sws';
    const projectFile = createProjectFile('proj-dup-001', 'Original Project');

    await enableTauriMock(page, { files: { [filePath]: JSON.stringify(projectFile) } });
    await seedProjects(page, { id: 'proj-dup-001', name: 'Original Project', filePath });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    // 1. Duplicate "Original Project" -> "Original Project - Copy"
    await page.getByTestId('project-card-menu-btn').first().click();
    await page.getByTestId('menu-duplicate-btn').click();

    // Verify 2 cards (Original + Copy)
    await expect(page.getByTestId('project-card')).toHaveCount(2, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Original Project - Copy', exact: true })).toBeVisible();

    // 2. Duplicate "Original Project" AGAIN -> "Original Project - Copy 2"
    // Find the menu button of the ORIGINAL project (first one usually, or filter by text)
    // Note: The new project (Copy) usually appears first if sorted by date Modified.
    // So "Original Project" should be the second one.
    // Let's verify sorting order or target specifically.
    
    // Target the card with "Original Project" title
    const originalCard = page.locator('article').filter({ hasText: /^Original Project$/ });
    await originalCard.getByTestId('project-card-menu-btn').click();
    await page.getByTestId('menu-duplicate-btn').click();

    // Verify 3 cards total
    await expect(page.getByTestId('project-card')).toHaveCount(3, { timeout: 10000 });
    
    // Verify "Original Project - Copy 2" exists
    await expect(page.getByRole('heading', { name: 'Original Project - Copy 2', exact: true })).toBeVisible();

    // Check Tauri File System Interaction
    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const writeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|write_text_file');
    
    // Should have written 2 new files
    // 1. "Original - Copy.sws"
    // 2. "Original - Copy 2.sws"
    expect(writeCalls.length).toBeGreaterThanOrEqual(2);
    
    const filePaths = writeCalls.map((c: any) => c.args.path);
    const hasCopy = filePaths.some((p: string) => p.includes('Original Project - Copy.sws'));
    const hasCopy2 = filePaths.some((p: string) => p.includes('Original Project - Copy 2.sws'));
    
    expect(hasCopy).toBeTruthy();
    expect(hasCopy2).toBeTruthy();
  });
});
