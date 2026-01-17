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
        if (cmd === 'plugin:fs|exists') {
          return Object.prototype.hasOwnProperty.call(mock.files, args?.path);
        }
        if (cmd === 'plugin:fs|remove_file') {
          delete mock.files[args?.path];
          return null;
        }
        return null;
      },
    };
  }, { files: options?.files ?? {} });
}

async function seedProjects(page: Page, projects: Array<{ id: string; name: string; filePath: string }>) {
  await page.addInitScript((items) => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: items.map((item: any) => ({
          projectId: item.id,
          projectName: item.name,
          projectNumber: 'DEL-1',
          clientName: 'Test Client',
          entityCount: 0,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          storagePath: item.filePath,
          filePath: item.filePath,
          isArchived: false,
        })),
        recentProjectIds: items.map((item: any) => item.id),
        loading: false,
      },
      version: 0,
    }));
  }, projects);
}

test.describe('UJ-PM-004: Delete Project (Tauri Offline)', () => {
  test('Delete removes project from list and file system', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/DeleteMe.sws';
    const backupPath = `${filePath}.bak`;

    await enableTauriMock(page, { files: { [filePath]: 'file', [backupPath]: 'backup' } });
    await seedProjects(page, [{ id: 'proj-delete-001', name: 'Project to Delete', filePath }]);

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    await page.getByTestId('project-card-menu-btn').first().click();
    await page.getByTestId('menu-delete-btn').click();

    await expect(page.getByTestId('delete-confirm-dialog')).toBeVisible();
    await page.getByTestId('delete-confirm-input').fill('Project to Delete');
    await page.getByTestId('delete-confirm-btn').click();

    await expect(page.getByText('Project to Delete')).not.toBeVisible();

    const tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    const removeCalls = tauriCalls.filter((call: any) => call.cmd === 'plugin:fs|remove_file');
    const removedPaths = removeCalls.map((call: any) => call.args?.path);

    expect(removedPaths).toContain(filePath);
    expect(removedPaths).toContain(backupPath);
  });
});
