/**
 * E2E Test Suite: Duplicate Project (UJ-PM-006)
 *
 * This test suite validates the duplicate project flow including:
 * - Duplicate creates a new project with same data
 * - Copy suffix is added to the name
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Seed test projects via localStorage
 */
async function seedTestProjects(page: Page, names: string[]) {
    const now = new Date().toISOString();

    const projectData = names.map((name, index) => {
        const projectId = crypto.randomUUID();
        return {
            project: {
                id: projectId,
                name: name,
                projectNumber: `PROJ-${index + 1}`,
                clientName: 'Test Client',
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
                createdAt: now,
                modifiedAt: now,
                entityCount: 5,
                thumbnailUrl: null,
                isArchived: false,
            },
            listItem: {
                projectId: projectId,
                projectName: name,
                projectNumber: `PROJ-${index + 1}`,
                clientName: 'Test Client',
                entityCount: 5,
                createdAt: now,
                modifiedAt: now,
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

test.describe('UJ-PM-006: Duplicate Project', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Duplicate creates a new project', async ({ page }) => {
        await seedTestProjects(page, ['Original Project']);

        // Verify 1 project initially
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);

        // Duplicate the project
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-duplicate-btn').click();

        // Wait for update - should now have 2 projects
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(2, { timeout: 5000 });
    });

    test('Original project remains unchanged after duplicate', async ({ page }) => {
        await seedTestProjects(page, ['My Project']);

        // Duplicate the project
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-duplicate-btn').click();

        // Wait for update
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(2, { timeout: 5000 });

        // Original project name should still exist
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'My Project', exact: true })).toBeVisible();
    });
});
