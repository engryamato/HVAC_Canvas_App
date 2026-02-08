/**
 * E2E Test Suite: Export Project Report (UJ-PM-008)
 *
 * This test suite validates the export report flow including:
 * - Export dialog opens from File menu
 * - Report options are configurable
 * - Export button triggers export process
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Navigate to canvas with a test project
 */
async function navigateToCanvas(page: Page) {
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();

    const project = {
        id: projectId,
        name: 'Test Project',
        projectNumber: 'TEST-001',
        clientName: 'Test Client',
        location: 'Test Location',
        scope: {
            details: ['HVAC'],
            materials: [],
            projectType: 'Residential',
        },
        siteConditions: {},
        createdAt: now,
        modifiedAt: now,
        entityCount: 0,
        thumbnailUrl: null,
        isArchived: false,
    };

    const listItem = {
        projectId: projectId,
        projectName: 'Test Project',
        projectNumber: 'TEST-001',
        clientName: 'Test Client',
        entityCount: 0,
        createdAt: now,
        modifiedAt: now,
        storagePath: `project-${projectId}`,
        isArchived: false,
    };

    // Seed to localStorage
    await page.goto('/dashboard');
    await page.evaluate((data) => {
        localStorage.setItem('sws.projectDetails', JSON.stringify({
            state: { projects: [data.project] },
            version: 0,
        }));
        localStorage.setItem('sws.projectIndex', JSON.stringify({
            state: {
                projects: [data.listItem],
                recentProjectIds: [data.projectId],
                loading: false,
            },
            version: 0,
        }));
    }, { project, listItem, projectId });

    // Navigate to canvas
    await page.goto(`/canvas/${projectId}`);
    await page.waitForLoadState('networkidle');

    return projectId;
}

test.describe('UJ-PM-008: Export Project Report', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Export dialog opens from export menu', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'Export...' }).click();

        // Verify dialog opens
        await expect(page.getByTestId('enhanced-export-dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Export' })).toBeVisible();
    });

    test('Export dialog has all required options', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'Export...' }).click();

        // Verify options are present
        await expect(page.getByText('Format')).toBeVisible();
        await expect(page.getByText('Include')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    });

    test('Cancel button closes dialog', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'Export...' }).click();

        await expect(page.getByTestId('enhanced-export-dialog')).toBeVisible();

        // Click Cancel
        await page.getByRole('button', { name: 'Cancel' }).click();

        // Dialog should close
        await expect(page.getByTestId('enhanced-export-dialog')).not.toBeVisible();
    });

    test('Format selection updates options', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'Export...' }).click();

        // Change to PNG
        await page.getByText('PNG').click();

        // Quality selector should appear
        await expect(page.getByText('Quality')).toBeVisible();
    });
});
