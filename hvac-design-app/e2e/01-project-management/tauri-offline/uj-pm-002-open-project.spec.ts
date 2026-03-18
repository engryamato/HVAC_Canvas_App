import { test, expect, type Page } from '@playwright/test';

const DEFAULT_DOCS_DIR = 'C:/Users/Test/Documents/';

async function enableTauriMock(page: Page, options?: { documentDir?: string; openPath?: string; savePath?: string; files?: Record<string, string> }) {
  await page.addInitScript(({ documentDir, openPath, savePath, files }) => {
    const mock = {
      files: (files || {}) as Record<string, string>,
      calls: [] as Array<{ cmd: string; args?: any }>,
      documentDir: documentDir || 'C:/Users/Test/Documents/',
      openPath: openPath || 'C:/Users/Test/Documents/HVAC_Projects/Office HVAC.sws',
      savePath: savePath || 'C:/Users/Test/Documents/HVAC_Projects/Saved From Canvas.sws',
    };

    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_MOCK__ = mock;
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: any) => {
        mock.calls.push({ cmd, args });
        if (cmd === 'plugin:path|resolve_directory') {
          return mock.documentDir;
        }
        if (cmd === 'plugin:dialog|open') {
          return mock.openPath;
        }
        if (cmd === 'plugin:dialog|save') {
          return mock.savePath;
        }
        if (cmd === 'plugin:fs|read_text_file') {
          return mock.files[args?.path] ?? '';
        }
        if (cmd === 'plugin:fs|write_text_file') {
          mock.files[args?.path] = String(args?.contents ?? '');
          return null;
        }
        if (cmd === 'plugin:fs|exists') {
          return Object.prototype.hasOwnProperty.call(mock.files, args?.path);
        }
        return null;
      },
    };
  }, {
    documentDir: options?.documentDir ?? DEFAULT_DOCS_DIR,
    openPath: options?.openPath ?? 'C:/Users/Test/Documents/HVAC_Projects/Office HVAC.sws',
    savePath: options?.savePath ?? 'C:/Users/Test/Documents/HVAC_Projects/Saved From Canvas.sws',
    files: options?.files ?? {},
  });
}

function createProjectFile(overrides?: Partial<Record<string, any>>) {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0.0',
    projectId: 'proj-open-001',
    projectName: 'Office HVAC',
    projectNumber: 'PO-123',
    clientName: 'Acme Corporation',
    location: '123 Main St, Chicago, IL',
    scope: { details: ['HVAC'], materials: [], projectType: 'Commercial' },
    siteConditions: {
      elevation: '0',
      outdoorTemp: '70',
      indoorTemp: '70',
      windSpeed: '0',
      humidity: '50',
      localCodes: ''
    },
    createdAt: now,
    modifiedAt: now,
    isArchived: false,
    entities: { byId: {}, allIds: [] },
    viewportState: { panX: 0, panY: 0, zoom: 1 },
    settings: { unitSystem: 'imperial', gridSize: 12, gridVisible: true },
    thumbnailUrl: null,
    version: '1.0.0',
    ...overrides,
  };
}

async function seedProjectIndex(page: Page, project: { projectId: string; projectName: string; filePath: string }) {
  await page.addInitScript((proj) => {
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: [
          {
            projectId: proj.projectId,
            projectName: proj.projectName,
            projectNumber: 'PO-123',
            clientName: 'Acme Corporation',
            entityCount: 0,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            storagePath: proj.filePath,
            filePath: proj.filePath,
            isArchived: false,
          }
        ],
        recentProjectIds: [proj.projectId],
        loading: false,
      },
      version: 0,
    }));
  }, project);
}

test.describe('UJ-PM-002: Open Existing Project (Tauri Offline)', () => {
  test('Open project from dashboard list', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/Office HVAC.sws';
    const projectFile = createProjectFile();

    await enableTauriMock(page, {
      openPath: filePath,
      files: {
        [filePath]: JSON.stringify(projectFile),
      },
    });

    await seedProjectIndex(page, {
      projectId: projectFile.projectId,
      projectName: projectFile.projectName,
      filePath,
    });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });

    const projectCard = page.getByTestId('project-card').filter({ hasText: 'Office HVAC' });
    await expect(projectCard.first()).toBeVisible({ timeout: 5000 });
    await projectCard.first().getByRole('button', { name: /open/i }).click();

    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await expect(page.getByTestId('header')).toBeVisible();
  });

  test('Open project from native dialog (File menu)', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/FromDialog.sws';
    const projectFile = createProjectFile({ projectId: 'proj-open-002', projectName: 'Dialog Project' });

    await enableTauriMock(page, {
      openPath: filePath,
      files: {
        [filePath]: JSON.stringify(projectFile),
      },
    });

    await page.addInitScript(() => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /open from file/i }).click();

    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await expect(page.getByTestId('header')).toBeVisible();
  });

  test('Auto-open last project when preference enabled', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/AutoOpen.sws';
    const projectFile = createProjectFile({ projectId: 'proj-open-003', projectName: 'Auto Open Project' });

    await enableTauriMock(page, {
      files: {
        [filePath]: JSON.stringify(projectFile),
      },
    });

    await page.addInitScript(() => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
      localStorage.setItem('sws.settings', JSON.stringify({ state: { autoOpenLastProject: true }, version: 0 }));
      localStorage.setItem('lastActiveProjectId', 'proj-open-003');
      localStorage.setItem('sws.projectIndex', JSON.stringify({
        state: {
          projects: [{
            projectId: 'proj-open-003',
            projectName: 'Auto Open Project',
            projectNumber: 'AO-1',
            clientName: 'Auto Client',
            entityCount: 0,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            storagePath: filePath,
            filePath: filePath,
            isArchived: false,
          }],
          recentProjectIds: ['proj-open-003'],
          loading: false,
        },
        version: 0,
      }));
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
  });

  test('Open from file shows error page for corrupted project', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/Corrupted.sws';

    await enableTauriMock(page, {
      openPath: filePath,
      files: {
        [filePath]: '{ invalid json',
      },
    });

    await page.addInitScript(() => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /open from file/i }).click();

    await expect(page.getByTestId('error-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('goto-dashboard-button')).toBeVisible();
  });

  test('Open from file shows version warning for newer project', async ({ page }) => {
    const filePath = 'C:/Users/Test/Documents/HVAC_Projects/NewerVersion.sws';
    const projectFile = createProjectFile({
      projectId: 'proj-open-004',
      projectName: 'Future Version',
      version: '2.0.0',
    });

    await enableTauriMock(page, {
      openPath: filePath,
      files: {
        [filePath]: JSON.stringify(projectFile),
      },
    });

    await page.addInitScript(() => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /open from file/i }).click();

    await expect(page.getByText('Newer Project Version')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Project version/i)).toBeVisible();
  });

  test('Save Project As and reopen from file completes a file round-trip', async ({ page }) => {
    const existingFilePath = 'C:/Users/Test/Documents/HVAC_Projects/RoundTrip Existing.sws';
    const savedFilePath = 'C:/Users/Test/Documents/HVAC_Projects/RoundTrip Saved.sws';
    const savedProject = createProjectFile({
      projectId: 'proj-open-roundtrip',
      projectName: 'Round Trip Project',
    });

    await enableTauriMock(page, {
      openPath: savedFilePath,
      savePath: savedFilePath,
      files: {
        [existingFilePath]: JSON.stringify(savedProject),
      },
    });

    await page.addInitScript(({ filePath, project }) => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
      localStorage.setItem('sws.projectDetails', JSON.stringify({
        state: {
          projects: [{
            id: project.projectId,
            name: project.projectName,
            ...project,
          }],
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
            filePath,
            isArchived: false,
          }],
          recentProjectIds: [project.projectId],
          loading: false,
        },
        version: 0,
      }));
    }, { filePath: existingFilePath, project: savedProject });

    await page.goto('/canvas/proj-open-roundtrip');
    await expect(page.getByTestId('header')).toBeVisible();

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /save project as/i }).click();

    let tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    expect(tauriCalls.some((call: any) => call.cmd === 'plugin:dialog|save')).toBe(true);
    expect(tauriCalls.some((call: any) => call.cmd === 'plugin:fs|write_text_file' && call.args?.path === 'C:/Users/Test/Documents/HVAC_Projects/RoundTrip Saved.sws')).toBe(true);

    await page.getByRole('button', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: /open from file/i }).click();

    await expect(page).toHaveURL(/\/canvas\//, { timeout: 10000 });
    await expect(page.getByText('Round Trip Project')).toBeVisible({ timeout: 10000 });

    tauriCalls = await page.evaluate(() => (window as any).__TAURI_MOCK__?.calls || []);
    expect(tauriCalls.some((call: any) => call.cmd === 'plugin:dialog|open')).toBe(true);
    expect(tauriCalls.some((call: any) => call.cmd === 'plugin:fs|read_text_file' && call.args?.path === 'C:/Users/Test/Documents/HVAC_Projects/RoundTrip Saved.sws')).toBe(true);
  });
});
