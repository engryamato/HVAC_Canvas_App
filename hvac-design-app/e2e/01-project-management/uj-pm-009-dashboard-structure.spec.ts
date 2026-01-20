/**
 * E2E Test Suite: Dashboard Structure (UJ-PM-009)
 *
 * This test suite validates that key dashboard structural elements are always visible,
 * preventing regression of "missing tabs" issues.
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Seed projects via localStorage
 */
async function seedProjects(
    page: Page,
    activeCount: number,
    archivedCount: number
) {
    const now = Date.now();
    const projects: any[] = [];
    const listItems: any[] = [];

    // Create Active Projects
    for (let i = 0; i < activeCount; i++) {
        const id = crypto.randomUUID();
        const p = {
            id,
            name: `Active Project ${i + 1}`,
            projectNumber: `AP-${i}`,
            isArchived: false,
            createdAt: new Date(now).toISOString(),
            modifiedAt: new Date(now).toISOString(),
        };
        projects.push(p);
        listItems.push({
            projectId: id,
            projectName: p.name,
            projectNumber: p.projectNumber,
            isArchived: false,
            createdAt: p.createdAt,
            modifiedAt: p.modifiedAt,
        });
    }

    // Create Archived Projects
    for (let i = 0; i < archivedCount; i++) {
        const id = crypto.randomUUID();
        const p = {
            id,
            name: `Archived Project ${i + 1}`,
            projectNumber: `ARC-${i}`,
            isArchived: true,
            createdAt: new Date(now).toISOString(),
            modifiedAt: new Date(now).toISOString(),
        };
        projects.push(p);
        listItems.push({
            projectId: id,
            projectName: p.name,
            projectNumber: p.projectNumber,
            isArchived: true,
            createdAt: p.createdAt,
            modifiedAt: p.modifiedAt,
        });
    }

    // Seed Storage
    await page.evaluate(({ projects, listItems }) => {
        localStorage.setItem('sws.projectDetails', JSON.stringify({
            state: { projects },
            version: 0
        }));
        localStorage.setItem('sws.projectIndex', JSON.stringify({
            state: { projects: listItems, recentProjectIds: [], loading: false },
            version: 0
        }));
        localStorage.setItem('hvac-app-storage', JSON.stringify({
            state: { hasLaunched: true },
            version: 0
        }));
    }, { projects, listItems });

    await page.reload();
    await page.waitForLoadState('networkidle');
}

test.describe('UJ-PM-009: Dashboard Structure Regression', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        // Clear storage to start fresh
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
    });

    test('Empty State: Tabs and Header are visible', async ({ page }) => {
        // Reload to ensure clear state takes effect
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify "No Projects" message is visible
        await expect(page.getByText('No projects yet')).toBeVisible();

        // **CRITICAL**: Verify Tabs ARE Visible even when empty
        const tabs = page.getByTestId('project-tabs');
        await expect(tabs).toBeVisible();

        // Verify Tab Counts are 0
        await expect(page.getByTestId('tab-active')).toContainText('Active');
        await expect(page.getByTestId('tab-active')).toContainText('0');
        
        await expect(page.getByTestId('tab-archived')).toContainText('Archived');
        await expect(page.getByTestId('tab-archived')).toContainText('0');

        // Verify New Project Buttons
        await expect(page.getByTestId('new-project-btn')).toBeVisible(); // Header button
        await expect(page.getByTestId('empty-state-create-btn')).toBeVisible(); // Empty state button
    });

    test('Populated State: Tabs match project counts', async ({ page }) => {
        // Seed 1 active, 1 archived
        await seedProjects(page, 1, 1);

        // Verify "No Projects" message is HIDDEN
        await expect(page.getByText('No projects yet')).toBeHidden();

        // **CRITICAL**: Verify Tabs ARE Visible
        const tabs = page.getByTestId('project-tabs');
        await expect(tabs).toBeVisible();

        // Verify Tab Counts
        await expect(page.getByTestId('tab-active')).toContainText('1');
        await expect(page.getByTestId('tab-archived')).toContainText('1');

        // Verify Project List is visible
        await expect(page.getByTestId('project-card')).toBeVisible();
    });
});
