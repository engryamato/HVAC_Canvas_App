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
        localStorage.setItem('project-storage', JSON.stringify({
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

// TODO: Enable when File menu and Export Report feature is implemented
test.describe.skip('UJ-PM-008: Export Project Report', () => {
    test.beforeEach(async ({ page }) => {
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Export Report dialog opens from File menu', async ({ page }) => {
        await navigateToCanvas(page);

        // Open File menu
        await page.getByRole('button', { name: 'File' }).click();

        // Click Export Report
        await page.getByTestId('menu-export-report').click();

        // Verify dialog opens
        await expect(page.getByTestId('export-report-dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Export Project Report' })).toBeVisible();
    });

    test('Export dialog has all required options', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'File' }).click();
        await page.getByTestId('menu-export-report').click();

        // Verify options are present
        await expect(page.getByTestId('report-type-select')).toBeVisible();
        await expect(page.getByTestId('include-details-checkbox')).toBeVisible();
        await expect(page.getByTestId('include-bom-checkbox')).toBeVisible();
        await expect(page.getByTestId('paper-size-select')).toBeVisible();
        await expect(page.getByTestId('orientation-select')).toBeVisible();
        await expect(page.getByTestId('export-btn')).toBeVisible();
        await expect(page.getByTestId('export-cancel-btn')).toBeVisible();
    });

    test('Cancel button closes dialog', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'File' }).click();
        await page.getByTestId('menu-export-report').click();

        await expect(page.getByTestId('export-report-dialog')).toBeVisible();

        // Click Cancel
        await page.getByTestId('export-cancel-btn').click();

        // Dialog should close
        await expect(page.getByTestId('export-report-dialog')).not.toBeVisible();
    });

    test('Report type selection updates included sections', async ({ page }) => {
        await navigateToCanvas(page);

        // Open Export dialog
        await page.getByRole('button', { name: 'File' }).click();
        await page.getByTestId('menu-export-report').click();

        // Default (Full Report) should have all checked
        await expect(page.getByTestId('include-details-checkbox')).toBeChecked();
        await expect(page.getByTestId('include-bom-checkbox')).toBeChecked();

        // Change to BOM Only
        await page.getByTestId('report-type-select').selectOption('bom');

        // Only BOM should be checked
        await expect(page.getByTestId('include-details-checkbox')).not.toBeChecked();
        await expect(page.getByTestId('include-bom-checkbox')).toBeChecked();
    });
});
