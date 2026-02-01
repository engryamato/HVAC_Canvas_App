/**
 * E2E Test Suite: Search & Filter Projects (UJ-PM-007)
 *
 * This test suite validates the search and filter flow including:
 * - Real-time search filtering by project name
 * - Sort dropdown functionality
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Seed multiple test projects via localStorage
 */
async function seedTestProjects(
    page: Page,
    projects: Array<{ name: string; projectNumber?: string; clientName?: string; createdDaysAgo?: number }>
) {
    const now = Date.now();

    const projectData = projects.map((config, index) => {
        const projectId = crypto.randomUUID();
        const createdAt = new Date(now - (config.createdDaysAgo || index) * 24 * 60 * 60 * 1000).toISOString();
        const modifiedAt = new Date(now - index * 60 * 60 * 1000).toISOString();

        return {
            project: {
                id: projectId,
                name: config.name,
                projectNumber: config.projectNumber || `PROJ-${index + 1}`,
                clientName: config.clientName || 'Test Client',
                location: 'Test Location',
                scope: {
                    details: ['HVAC'],
                    materials: [],
                    projectType: 'Residential',
                },
                siteConditions: {
                    elevation: '',
                    outdoorTemp: '',
                    indoorTemp: '',
                    windSpeed: '',
                    humidity: '',
                    localCodes: '',
                },
                createdAt,
                modifiedAt,
                entityCount: 5,
                thumbnailUrl: null,
                isArchived: false,
            },
            listItem: {
                projectId: projectId,
                projectName: config.name,
                projectNumber: config.projectNumber || `PROJ-${index + 1}`,
                clientName: config.clientName || 'Test Client',
                entityCount: 5,
                createdAt,
                modifiedAt,
                storagePath: `project-${projectId}`,
                isArchived: false,
            },
        };
    });

    // Seed to project-storage
    const projectStorage = {
        state: {
            projects: projectData.map((p) => p.project),
        },
        version: 0,
    };
    await page.evaluate((data) => {
        localStorage.setItem('sws.projectDetails', JSON.stringify(data));
    }, projectStorage);

    // Seed to sws.projectIndex
    const projectIndex = {
        state: {
            projects: projectData.map((p) => p.listItem),
            recentProjectIds: projectData.map((p) => p.listItem.projectId),
            loading: false,
        },
        version: 0,
    };
    await page.evaluate((data) => {
        localStorage.setItem('sws.projectIndex', JSON.stringify(data));
    }, projectIndex);

    await page.reload();
    await page.waitForLoadState('networkidle');
}

test.describe('UJ-PM-007: Search & Filter Projects', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Search filters projects by name', async ({ page }) => {
        await seedTestProjects(page, [
            { name: 'Alpha Building' },
            { name: 'Beta Tower' },
            { name: 'Alpha Center' },
        ]);

        const allProjects = page.getByTestId('all-projects');

        // All 3 projects should be visible initially
        await expect(allProjects.getByTestId('project-card')).toHaveCount(3, { timeout: 5000 });

        // Type search term
        const searchInput = page.getByPlaceholder('Search projects...');
        await searchInput.click();
        await searchInput.fill('Alpha');

        // Wait for debounced search to complete
        await page.waitForTimeout(500);

        // Verify filtered results
        await expect(allProjects.getByTestId('project-card')).toHaveCount(2, { timeout: 5000 });
        // Verify correct projects are shown
        await expect(allProjects.getByRole('heading', { name: 'Alpha Building' })).toBeVisible({ timeout: 5000 });
        await expect(allProjects.getByRole('heading', { name: 'Alpha Center' })).toBeVisible({ timeout: 5000 });
    });

    test('Clear search shows all projects', async ({ page }) => {
        await seedTestProjects(page, [
            { name: 'Alpha' },
            { name: 'Beta' },
            { name: 'Gamma' },
        ]);

        const allProjects = page.getByTestId('all-projects');

        // Search to filter
        const searchInput = page.getByPlaceholder('Search projects...');
        await searchInput.fill('Alpha');

        // Wait for debounce and filtering
        await page.waitForTimeout(500);
        await expect(allProjects.getByTestId('project-card')).toHaveCount(1, { timeout: 5000 });

        // Clear search by clearing input
        await searchInput.clear();

        // Wait for clear to propagate (SearchBar component calls onChange)
        await page.waitForTimeout(500);

        // Now all projects should be visible
        await expect(allProjects.getByTestId('project-card')).toHaveCount(3, { timeout: 5000 });
    });

    test('Sort select is visible', async ({ page }) => {
        await seedTestProjects(page, [{ name: 'Test Project' }]);

        // Verify sort dropdown is visible
        await expect(page.getByTestId('sort-select')).toBeVisible({ timeout: 5000 });

        // Wait a moment for page to settle
        await page.waitForTimeout(200);

        await expect(page.getByTestId('sort-select')).toHaveValue('date-desc');
    });

    test('Sort by Name orders alphabetically', async ({ page }) => {
        await seedTestProjects(page, [
            { name: 'Charlie Project' },
            { name: 'Alpha Project' },
            { name: 'Beta Project' },
        ]);

        // Change sort to Name (A-Z)
        await page.getByTestId('sort-select').selectOption('name-asc');

        // Wait a moment for re-render
        await page.waitForTimeout(300);

        // First card in All Projects should be Alpha (alphabetically first)
        const allProjectsSection = page.getByTestId('all-projects');
        const firstCard = allProjectsSection.getByTestId('project-card').first();
        await expect(firstCard).toContainText('Alpha Project');
    });
});
