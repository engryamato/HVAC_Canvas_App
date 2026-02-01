/**
 * E2E Test Suite: Archive/Restore Project (UJ-PM-005)
 *
 * This test suite validates the archive project flow including:
 * - Archive action moves project to Archived tab
 * - Tab switching shows correct projects
 * - Restore action returns project to Active tab
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Seed test projects via localStorage
 */
async function seedTestProjects(page: Page, configs: Array<{ name: string; isArchived?: boolean }>) {
    const now = new Date().toISOString();

    const projects = configs.map((config) => {
        const projectId = crypto.randomUUID();
        return {
            project: {
                id: projectId,
                name: config.name,
                projectNumber: 'TEST-001',
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
                isArchived: config.isArchived ?? false,
            },
            listItem: {
                projectId: projectId,
                projectName: config.name,
                projectNumber: 'TEST-001',
                clientName: 'Test Client',
                entityCount: 5,
                createdAt: now,
                modifiedAt: now,
                storagePath: `project-${projectId}`,
                isArchived: config.isArchived ?? false,
            },
        };
    });

    // Seed to project-storage
    const projectStorage = {
        state: {
            projects: projects.map((p) => p.project),
        },
        version: 0,
    };
    await page.evaluate((data) => {
        localStorage.setItem('sws.projectDetails', JSON.stringify(data));
    }, projectStorage);

    // Seed to sws.projectIndex
    const projectIndex = {
        state: {
            projects: projects.map((p) => p.listItem),
            recentProjectIds: projects.filter((p) => !p.listItem.isArchived).map((p) => p.listItem.projectId),
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

test.describe('UJ-PM-005: Archive/Restore Project', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Tab navigation shows correct project counts', async ({ page }) => {
        // Seed 2 active and 1 archived project
        await seedTestProjects(page, [
            { name: 'Active Project 1' },
            { name: 'Active Project 2' },
            { name: 'Archived Project', isArchived: true },
        ]);

        // Verify tab counts using robust test IDs
        await expect(page.getByTestId('tab-active')).toBeVisible();
        await expect(page.getByTestId('tab-active')).toContainText('2');
        
        await expect(page.getByTestId('tab-archived')).toBeVisible();
        await expect(page.getByTestId('tab-archived')).toContainText('1');

        // Verify Active tab shows 2 projects
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(2);

        // Switch to Archived tab
        await page.getByTestId('tab-archived').click();

        // Verify Archived tab shows 1 project
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Archived Project' })).toBeVisible();
    });

    test('File menu navigation switches to Archived tab', async ({ page }) => {
        // Seed 1 active and 1 archived project
        await seedTestProjects(page, [
            { name: 'Active Project' },
            { name: 'Archived Project', isArchived: true },
        ]);

        // Open File Menu and click Archived Projects
        await page.getByRole('button', { name: 'File' }).click();
        await expect(page.getByTestId('menu-archived')).toBeVisible();
        await page.getByTestId('menu-archived').click();

        // Verify URL and Tab state
        await expect(page).toHaveURL(/.*view=archived/);
        
        // Verify Archived tab is active
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Archived Project' })).toBeVisible();

        // NOW: Return to Dashboard
        await page.getByRole('button', { name: 'File' }).click();
        await expect(page.getByTestId('menu-dashboard')).toBeVisible();
        await page.getByTestId('menu-dashboard').click();

        // Verify URL is back to root (no query param or view=active implicitly)
        // Note: The app might just remove the query param or set it to null.
        // We mainly check the UI state.
        
        await expect(page.getByTestId('tab-active')).toBeVisible();
        // Check that we see the active project again
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Active Project' })).toBeVisible();
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);
    });

    test('Archive action moves project to Archived tab', async ({ page }) => {
        // Seed 2 active projects
        await seedTestProjects(page, [
            { name: 'Project to Archive' },
            { name: 'Remaining Project' },
        ]);

        // Verify 2 active projects
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(2);

        // Archive the first project
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-archive-btn').click();

        // Wait for update and verify counts
        await expect(page.getByTestId('tab-active')).toContainText('1');
        await expect(page.getByTestId('tab-archived')).toContainText('1');
        
        // STRICT VISIBILITY: Verify 'Project to Archive' is GONE from Active tab
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Project to Archive' })).not.toBeVisible();
        
        // SWITCH to Archived tab
        await page.getByTestId('tab-archived').click();
        
        // Verify 'Project to Archive' IS present
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Project to Archive' })).toBeVisible();
        
        // Verify 'Remaining Project' is NOT present in Archived
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Remaining Project' })).not.toBeVisible();
    });

    test('Restore action moves project back to Active tab', async ({ page }) => {
        // Seed 1 active and 1 archived project
        await seedTestProjects(page, [
            { name: 'Active Project' },
            { name: 'Archived Project', isArchived: true },
        ]);

        // Switch to Archived tab
        await page.getByTestId('tab-archived').click();

        // Verify 1 archived project
        await expect(page.getByTestId('all-projects').getByTestId('project-card')).toHaveCount(1);
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Archived Project' })).toBeVisible();

        // Restore the project
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-restore-btn').click();

        // Wait for update and verify counts
        await expect(page.getByTestId('tab-active')).toContainText('2');
        await expect(page.getByTestId('tab-archived')).toContainText('0');
        
        // Verify 'Archived Project' is GONE from Archived tab
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Archived Project' })).not.toBeVisible();
        
        // SWITCH to Active tab
        await page.getByTestId('tab-active').click();
        
        // Verify 'Archived Project' IS present in Active tab
        await expect(page.getByTestId('all-projects').getByRole('heading', { name: 'Archived Project' })).toBeVisible();
    });
});
