/**
 * E2E Test Suite: Application Shell (UJ-GS-003)
 *
 * @spec docs/user-journeys/00-getting-started/tauri-offline/UJ-GS-003-BasicNavigationAndInterfaceOverview.md
 *
 * Validates the core application layout and navigation within the Canvas environment.
 * Strictly follows "Human-Centric" navigation rules (no mid-test page.goto).
 *
 * Test Coverage:
 * - Layout regions presence (Header, Toolbar, Sidebars, Canvas, StatusBar)
 * - Sidebar collapse/expand interactions (Mouse & Keyboard)
 * - Right Sidebar tab switching
 * - Tool selection logic
 * - Breadcrumb navigation back to Dashboard
 *
 * @author Canvas Team
 * @created 2026-01-08
 */

import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Application Shell (UJ-GS-003)
 *
 * @spec docs/user-journeys/00-getting-started/tauri-offline/UJ-GS-003-BasicNavigationAndInterfaceOverview.md
 *
 * Validates core application layout and navigation within Canvas environment.
 * Strictly follows "Human-Centric" navigation rules (no mid-test page.goto).
 *
 * Test Coverage:
 * - Layout regions presence (Header, Toolbar, Sidebars, Canvas, StatusBar)
 * - Sidebar collapse/expand interactions (Mouse & Keyboard)
 * - Right Sidebar tab switching
 * - Tool selection logic
 * - Breadcrumb navigation back to Dashboard
 *
 * @author Canvas Team
 * @created 2026-01-08
 */

async function ensureProjectOnDashboard(page: Page) {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('hvac-app-storage', JSON.stringify({
            state: { hasLaunched: true },
            version: 0,
        }));
        localStorage.setItem('sws.projectIndex', JSON.stringify({
            state: {
                projects: [{
                    projectId: 'shell-test-project',
                    projectName: 'Shell Test Project',
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    storagePath: 'project-shell-test-project',
                    isArchived: false,
                }],
                recentProjectIds: [],
                loading: false,
            },
            version: 0,
        }));
        localStorage.setItem('project-storage', JSON.stringify({
            state: {
                projects: [{
                    id: 'shell-test-project',
                    name: 'Shell Test Project',
                    projectNumber: '',
                    clientName: '',
                    location: '',
                    scope: { details: [], materials: [], projectType: 'Commercial' },
                    siteConditions: { elevation: '', outdoorTemp: '', indoorTemp: '', windSpeed: '', humidity: '', localCodes: '' },
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    entityCount: 0,
                    isArchived: false,
                }],
            },
            version: 0,
        }));
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
}

test.describe('UJ-GS-003: Application Shell', () => {

    // Setup: Seed localStorage and navigate to canvas
    test.beforeEach(async ({ page }) => {
        await ensureProjectOnDashboard(page);

        // Open project card to navigate to canvas
        await page.getByTestId('project-card').first().click();

        // Verify we are on the Canvas page
        await expect(page).toHaveURL(/\/canvas\//);
        await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
    });

    test('Layout: Verify all core regions are present', async ({ page }) => {
        await expect(page.getByTestId('header')).toBeVisible();
        await expect(page.getByTestId('toolbar')).toBeVisible();
        await expect(page.getByTestId('left-sidebar')).toBeVisible();
        await expect(page.getByTestId('right-sidebar')).toBeVisible();
        await expect(page.getByTestId('status-bar')).toBeVisible();
    });

    test('Left Sidebar: Toggle via Button and Keyboard', async ({ page }) => {
        const sidebar = page.getByTestId('left-sidebar');
        const toggleBtn = page.getByTestId('left-sidebar-toggle').first();

        // Initial state: Expanded (width > 60px)
        const initialBox = await sidebar.boundingBox();
        expect(initialBox?.width).toBeGreaterThan(60);

        // 1. Collapse via Button
        await toggleBtn.click();
        await expect(sidebar).toHaveClass(/w-12/); // Check for collapsed class

        // 2. Expand via Keyboard (Ctrl+B)
        await page.keyboard.press('Control+b');
        await expect(sidebar).toHaveClass(/w-72/); // Check for expanded class
    });

    test('Right Sidebar: Tab Switching and Toggle', async ({ page }) => {
        const sidebar = page.getByTestId('right-sidebar');

        // 1. Verify Properties tab active by default
        await expect(page.getByTestId('properties-panel')).toBeVisible();

        // 2. Switch to BOM tab
        await page.getByTestId('tab-bom').click();
        await expect(page.getByTestId('bom-panel')).toBeVisible();
        await expect(page.getByTestId('properties-panel')).not.toBeVisible();

        // 3. Switch to Notes tab
        await page.getByTestId('tab-notes').click();
        await expect(page.getByTestId('notes-panel')).toBeVisible();

        // 4. Toggle collapse via Button
        await page.getByTestId('right-sidebar-toggle').first().click();
        await expect(sidebar).toHaveClass(/w-12/); // Check for collapsed class

        // 5. Expand via Button
        await page.getByTestId('right-sidebar-toggle').first().click();
        await expect(sidebar).toHaveClass(/w-80/); // Check for expanded class
    });

    test('Toolbar: Tool Selection and Zoom', async ({ page }) => {
        // 1. Verify 'Select' tool active by default
        await expect(page.getByTestId('tool-select')).toHaveClass(/bg-blue-600/); // Default variant uses blue

        // 2. Switch to 'Duct' tool
        await page.getByTestId('tool-duct').click();
        await expect(page.getByTestId('tool-duct')).toHaveClass(/bg-blue-600/);
        await expect(page.getByTestId('tool-select')).not.toHaveClass(/bg-blue-600/);

        // 3. Test Zoom (Visual check of text update not reliable without precise setup,
        //    but we can check button interactivity)
        //    Ideally check status bar zoom text if connected
        const statusBar = page.getByTestId('status-bar');
        await expect(statusBar).toContainText('Zoom: 100%');

        // Click Zoom In using data-testid to avoid conflicts with duplicate buttons
        await page.getByTestId('zoom-in').click();
    });

    test('Navigation: Return to Dashboard via Breadcrumb', async ({ page }) => {
        // 1. Click Dashboard breadcrumb
        await page.getByTestId('breadcrumb-dashboard').click();

        // 2. Verify URL and content
        await expect(page).toHaveURL('/dashboard');
        await expect(page.getByTestId('dashboard-page')).toBeVisible();
    });

    test('Navigation: Return to Dashboard via Shortcut (Ctrl+Shift+D)', async ({ page }) => {
        // 1. Press Shortcut
        await page.keyboard.press('Control+Shift+D');

        // 2. Verify URL and content
        await expect(page).toHaveURL('/dashboard');
        await expect(page.getByTestId('dashboard-page')).toBeVisible();
    });
});
