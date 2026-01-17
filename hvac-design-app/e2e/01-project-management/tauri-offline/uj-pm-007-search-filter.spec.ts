import { test, expect, type Page } from '@playwright/test';

async function enableTauriMock(page: Page) {
  await page.addInitScript(() => {
    (window as any).__TAURI__ = { __mock__: true };
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async () => null,
    };
  });
}

async function seedProjects(page: Page, projects: Array<{ name: string; archived?: boolean; client?: string; number?: string; modifiedAt?: string }>) {
  await page.addInitScript((items) => {
    const now = new Date().toISOString();
    localStorage.setItem('hvac-app-storage', JSON.stringify({ state: { hasLaunched: true }, version: 0 }));
    localStorage.setItem('sws.projectIndex', JSON.stringify({
      state: {
        projects: items.map((item: any, index: number) => ({
          projectId: `proj-search-${index + 1}`,
          projectName: item.name,
          projectNumber: item.number ?? `SR-${index + 1}`,
          clientName: item.client ?? 'Search Client',
          entityCount: 0,
          createdAt: now,
          modifiedAt: item.modifiedAt ?? new Date(Date.now() - index * 1000).toISOString(),
          storagePath: `C:/Users/Test/Documents/HVAC_Projects/${item.name}.sws`,
          filePath: `C:/Users/Test/Documents/HVAC_Projects/${item.name}.sws`,
          isArchived: item.archived ?? false,
        })),
        recentProjectIds: [],
        loading: false,
      },
      version: 0,
    }));
  }, projects);
}

test.describe('UJ-PM-007: Search and Filter Projects (Tauri Offline)', () => {
  test('Search filters by project name', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjects(page, [
      { name: 'Alpha Building' },
      { name: 'Beta Tower' },
      { name: 'Alpha Center' },
    ]);

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-page')).toBeVisible();

    const searchInput = page.getByPlaceholder('Search projects...');
    await searchInput.fill('Alpha');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('project-card')).toHaveCount(2, { timeout: 5000 });
    await expect(page.getByText('Alpha Building')).toBeVisible();
    await expect(page.getByText('Alpha Center')).toBeVisible();
  });

  test('Clear search restores full list', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjects(page, [
      { name: 'Alpha' },
      { name: 'Beta' },
      { name: 'Gamma' },
    ]);

    await page.goto('/dashboard');
    const searchInput = page.getByPlaceholder('Search projects...');
    await searchInput.fill('Alpha');
    await page.waitForTimeout(500);
    await expect(page.getByTestId('project-card')).toHaveCount(1);

    await searchInput.clear();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('project-card')).toHaveCount(3, { timeout: 5000 });
  });

  test('Archived tab filters archived projects', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjects(page, [
      { name: 'Active Project' },
      { name: 'Archived Project', archived: true },
    ]);

    await page.goto('/dashboard');
    await page.getByTestId('tab-archived').click();

    await expect(page.getByText('Archived Project')).toBeVisible();
    await expect(page.getByText('Active Project')).not.toBeVisible();
  });

  test('Rescan button appears in Tauri mode', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjects(page, [{ name: 'Rescan Project' }]);

    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /rescan/i })).toBeVisible();
  });

  test('Search matches client and project number', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjects(page, [
      { name: 'Office HVAC', client: 'Alpha Mechanical', number: 'PM-100' },
      { name: 'Retail HVAC', client: 'Beta Builders', number: 'PM-200' },
    ]);

    await page.goto('/dashboard');
    const searchInput = page.getByPlaceholder('Search projects...');

    await searchInput.fill('Alpha');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('project-card')).toHaveCount(1);
    await expect(page.getByText('Office HVAC')).toBeVisible();

    await searchInput.fill('PM-200');
    await page.waitForTimeout(400);
    await expect(page.getByTestId('project-card')).toHaveCount(1);
    await expect(page.getByText('Retail HVAC')).toBeVisible();
  });

  test('Sort by name asc and date desc', async ({ page }) => {
    await enableTauriMock(page);
    await seedProjects(page, [
      { name: 'Zulu Project', modifiedAt: '2026-01-01T10:00:00.000Z' },
      { name: 'Alpha Project', modifiedAt: '2026-01-02T10:00:00.000Z' },
      { name: 'Gamma Project', modifiedAt: '2026-01-03T10:00:00.000Z' },
    ]);

    await page.goto('/dashboard');

    await page.selectOption('#sort-select', 'name-asc');
    const cards = page.getByTestId('project-card');
    await expect(cards.nth(0)).toContainText('Alpha Project');
    await expect(cards.nth(1)).toContainText('Gamma Project');
    await expect(cards.nth(2)).toContainText('Zulu Project');

    await page.selectOption('#sort-select', 'date-desc');
    await expect(cards.nth(0)).toContainText('Gamma Project');
  });
});
