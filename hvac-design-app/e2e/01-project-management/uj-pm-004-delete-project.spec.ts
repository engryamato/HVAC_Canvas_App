/**
 * E2E Test Suite: Delete Project (UJ-PM-004)
 *
 * This test suite validates the delete project flow including:
 * - Delete button in action menu
 * - Project is removed from the list after deletion
 * 
 * Note: This component performs direct delete, not dialog confirmation.
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

    // Seed to sws.projectDetails
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

    await page.goto('/dashboard?skipSplash=true');
    await page.waitForLoadState('networkidle');
}

test.describe('UJ-PM-004: Delete Project', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard?skipSplash=true');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto('/dashboard?skipSplash=true');
    });

    test('Delete removes project from list', async ({ page }) => {
        await seedTestProjects(page, ['Project to Delete', 'Remaining Project']);

        // Verify both projects are visible in the All Projects section
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(2);

        // Delete the first project
        await page.getByTestId('project-card-menu-btn').first().evaluate(node => (node as HTMLElement).click());
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-delete-btn').click();

        // Confirm delete
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: 'Delete Project' }).click();

        // Verify project is removed
        await expect(page.getByText('Project to Delete')).not.toBeVisible();
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);
        await expect(page.getByRole('heading', { name: 'Remaining Project' })).toBeVisible();
    });

    test('Deleting last project shows empty state', async ({ page }) => {
        await seedTestProjects(page, ['Only Project']);

        // Verify project is visible in All Projects section
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);

        // Delete the project
        await page.getByTestId('project-card-menu-btn').first().evaluate(node => (node as HTMLElement).click());
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-delete-btn').click();

        // Confirm delete
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('button', { name: 'Delete Project' }).click();

        // Should show empty state
        await expect(page.getByText('No projects found')).toBeVisible();
    });
});
