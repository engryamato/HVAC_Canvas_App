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

  // Skip on Firefox/WebKit due to cross-browser timing issues
  test('Backup recovery shows toast on canvas load', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Backup toast timing unreliable on Firefox/WebKit');
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    });
    
    // Create valid project payload and calculate checksum in browser context to ensure consistency
    const { projectId, payload } = await page.evaluate(() => {
        const pid = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID required by schema
        const now = new Date().toISOString();
        
        // Match expected ProjectFileSchema structure
        const validProject = {
            schemaVersion: '1.0.0',
            projectId: pid,
            projectName: 'Backup Project',
            createdAt: now,
            modifiedAt: now,
            entities: { byId: {}, allIds: [] },
            viewportState: { panX: 0, panY: 0, zoom: 1 },
            settings: { unitSystem: 'imperial', gridSize: 24, gridVisible: true },
            calculations: undefined,
            billOfMaterials: undefined
        };
        
        const projectPayload = { project: validProject };
        
        // FNV-1a hash implementation matching app
        let hash = 2166136261;
        const value = JSON.stringify(projectPayload);
        for (let i = 0; i < value.length; i += 1) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        const checksum = (hash >>> 0).toString(16).padStart(8, '0');
        
        return {
            projectId: pid,
            payload: {
                schemaVersion: '1.0.0',
                projectId: pid,
                savedAt: now,
                checksum,
                payload: projectPayload
            }
        };
    });

    await page.evaluate(({ projectId, payload }) => {
      localStorage.setItem(`hvac-project-${projectId}`, 'corrupted');
      localStorage.setItem(`hvac-project-${projectId}-backup`, JSON.stringify(payload));
      localStorage.setItem('sws.projectIndex', JSON.stringify({
        state: {
          projects: [{
            projectId,
            projectName: 'Backup Project',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            storagePath: `project-${projectId}`,
            isArchived: false,
            entityCount: 0
          }],
          recentProjectIds: [],
          loading: false
        },
        version: 0
      }));
    }, { projectId, payload });

    // Directly navigate to the project canvas
    await page.goto(`/canvas/${projectId}`);
    
    // Wait for canvas to fully load
    await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    // Give time for useAutoSave to load project and set backup flag
    await page.waitForTimeout(500);
    
    // Check for toast
    const toast = page.getByText('Backup loaded');
    await expect(toast).toBeVisible({ timeout: 15000 });
  });

  // Skip this test - Tauri API mocking doesn't reflect real behavior in web mode
  test.skip('Tauri file system check attempts document directory access', async ({ page }) => {
    await page.goto('/');
    await page.reload();

    const invokeCalls = await page.evaluate(() => {
      return (window as any).__TAURI_MOCK__?.calls || [];
    });

    const hasDocumentDirCall = invokeCalls.some((call: any) => call.cmd === 'plugin:path|resolve_directory');
    expect(hasDocumentDirCall).toBe(true);
  });
});
