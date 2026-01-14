/**
 * E2E Test Suite: Edit Project Metadata (UJ-PM-003)
 *
 * This test suite validates the edit (rename) project flow including:
 * - Menu edit option triggers inline rename
 * - Saving changes updates project in the list
 * - Cancel/Escape restore original name
 * 
 * Note: This component uses inline rename, not a dialog.
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Seed test projects via localStorage
 */
async function seedTestProject(
    page: Page,
    config: { name: string; projectNumber?: string; clientName?: string }
) {
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();

    const project = {
        id: projectId,
        name: config.name,
        projectNumber: config.projectNumber || 'TEST-001',
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
        createdAt: now,
        modifiedAt: now,
        entityCount: 5,
        thumbnailUrl: null,
        isArchived: false,
    };

    const listItem = {
        projectId: projectId,
        projectName: config.name,
        projectNumber: config.projectNumber || 'TEST-001',
        clientName: config.clientName || 'Test Client',
        entityCount: 5,
        createdAt: now,
        modifiedAt: now,
        storagePath: `project-${projectId}`,
        isArchived: false,
    };

    // Seed to project-storage
    const projectStorage = {
        state: {
            projects: [project],
        },
        version: 0,
    };
    await page.evaluate((data) => {
        localStorage.setItem('project-storage', JSON.stringify(data));
    }, projectStorage);

    // Seed to sws.projectIndex
    const projectIndex = {
        state: {
            projects: [listItem],
            recentProjectIds: [projectId],
            loading: false,
        },
        version: 0,
    };
    await page.evaluate((data) => {
        localStorage.setItem('sws.projectIndex', JSON.stringify(data));
    }, projectIndex);

    await page.reload();
    await page.waitForLoadState('networkidle');

    return { projectId, project, listItem };
}

test.describe('UJ-PM-003: Edit Project Metadata', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Rename option opens inline edit mode', async ({ page }) => {
        await seedTestProject(page, {
            name: 'Original Project Name',
        });

        // Open the action menu
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();

        // Click Rename (which is the edit option)
        await page.getByTestId('menu-edit-btn').click();

        // Verify inline input appears with the project name
        await expect(page.getByRole('textbox', { name: 'Project name' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Project name' })).toHaveValue('Original Project Name');
    });

    test('Saving changes updates project name in list', async ({ page }) => {
        await seedTestProject(page, {
            name: 'Project Before Rename',
        });

        // Verify original name shows
        await expect(page.getByRole('heading', { name: 'Project Before Rename' })).toBeVisible();

        // Open rename mode
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-edit-btn').click();

        // Change the name
        const input = page.getByRole('textbox', { name: 'Project name' });
        await input.clear();
        await input.fill('Project After Rename');

        // Save - click the Save button
        await page.getByRole('button', { name: 'Save' }).click();

        // Wait for update
        await page.waitForTimeout(300);

        // Verify new name shows in the list
        await expect(page.getByRole('heading', { name: 'Project After Rename' })).toBeVisible();
    });

    test('Escape key cancels rename', async ({ page }) => {
        await seedTestProject(page, {
            name: 'Unchanged Project',
        });

        // Open rename mode
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-edit-btn').click();

        // Change the name in the input
        const input = page.getByRole('textbox', { name: 'Project name' });
        await input.clear();
        await input.fill('Changed Name');

        // Press Escape
        await page.keyboard.press('Escape');

        // Original name should still be visible
        await expect(page.getByRole('heading', { name: 'Unchanged Project' })).toBeVisible();
    });

    test('Enter key saves the new name', async ({ page }) => {
        await seedTestProject(page, {
            name: 'Original Name',
        });

        // Open rename mode
        await page.getByTestId('project-card-menu-btn').first().click();
        await expect(page.getByTestId('project-card-menu')).toBeVisible();
        await page.getByTestId('menu-edit-btn').click();

        // Change the name and press Enter
        const input = page.getByRole('textbox', { name: 'Project name' });
        await input.clear();
        await input.fill('New Name via Enter');
        await page.keyboard.press('Enter');

        // Wait for update
        await page.waitForTimeout(300);

        // Verify new name shows
        await expect(page.getByRole('heading', { name: 'New Name via Enter' })).toBeVisible();
    });
});
