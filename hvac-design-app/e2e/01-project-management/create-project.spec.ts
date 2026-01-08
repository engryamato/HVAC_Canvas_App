/**
 * E2E Test Suite: Create New Project (UJ-PM-001)
 *
 * This test suite validates the complete project creation workflow
 * using strictly HUMAN-CENTRIC navigation (no page.goto mid-flow).
 *
 * Test Coverage:
 * - Dashboard loads and displays correctly
 * - New Project dialog opens and validates input
 * - Project creation and navigation to canvas
 * - Project persistence verification
 *
 * @author Dashboard Team
 * @created 2026-01-08
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Clear all application storage to simulate fresh start
 */
async function clearProjectStorage(page: Page) {
    await page.goto('/dashboard');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    // Reload to apply cleared storage
    await page.reload();
}

test.describe('UJ-PM-001: Create New Project', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure clean slate for each test
        await clearProjectStorage(page);
    });

    test('Flow 1: Create Project from Empty State', async ({ page }) => {
        // 1. Verify Dashboard loads with empty state
        await expect(page.getByTestId('dashboard-page')).toBeVisible();
        await expect(page.getByText('No Projects Yet')).toBeVisible();

        // 2. Click "Create Your First Project" button
        await page.getByTestId('empty-state-create-btn').click();

        // 3. Verify New Project Dialog opens
        await expect(page.getByTestId('new-project-dialog')).toBeVisible();
        await expect(page.getByText('Create New Project')).toBeVisible();

        // 4. Fill in project details
        await page.getByTestId('project-name-input').fill('Office Building HVAC');
        await page.getByLabel('Project Number').fill('2025-001');
        await page.getByLabel('Client Name').fill('Acme Corporation');
        await page.getByLabel('Location').fill('123 Main St, Chicago, IL');

        // 5. Create project
        await page.getByTestId('create-project-btn').click();

        // 6. Verify navigation to Canvas
        await expect(page).toHaveURL(/\/canvas\//);
    });

    test('Flow 2: Create Project from Header Button', async ({ page }) => {
        // Note: This test assumes we have at least one project
        // So we first create one, then verify the header button works

        // 1. Create first project via empty state
        await page.getByTestId('empty-state-create-btn').click();
        await page.getByTestId('project-name-input').fill('First Project');
        await page.getByTestId('create-project-btn').click();
        await expect(page).toHaveURL(/\/canvas\//);

        // 2. Navigate back to Dashboard via breadcrumb (Human-Centric!)
        // For now, we'll use keyboard shortcut as breadcrumb may not exist yet
        await page.keyboard.press('Control+Shift+D');
        await expect(page).toHaveURL('/dashboard');

        // 3. Verify project grid is visible (no longer empty)
        await expect(page.getByTestId('project-grid')).toBeVisible();

        // 4. Click "New Project" button in header
        await page.getByTestId('new-project-btn').click();

        // 5. Verify dialog opens
        await expect(page.getByTestId('new-project-dialog')).toBeVisible();

        // 6. Fill minimal data (only required field)
        await page.getByTestId('project-name-input').fill('Second Project');

        // 7. Submit via Enter key
        await page.getByTestId('project-name-input').press('Enter');

        // 8. Verify navigation
        await expect(page).toHaveURL(/\/canvas\//);
    });

    test('Validation: Empty Project Name', async ({ page }) => {
        // 1. Open dialog
        await page.getByTestId('empty-state-create-btn').click();

        // 2. Verify Create button is disabled when name is empty
        const createButton = page.getByTestId('create-project-btn');
        await expect(createButton).toBeDisabled();

        // 3. Enter spaces only
        await page.getByTestId('project-name-input').fill('   ');

        // 4. Verify still disabled
        await expect(createButton).toBeDisabled();

        // 5. Clear and enter valid name
        await page.getByTestId('project-name-input').fill('Valid Project');

        // 6. Verify now enabled
        await expect(createButton).not.toBeDisabled();
    });

    test('Validation: Character Limit', async ({ page }) => {
        // 1. Open dialog
        await page.getByTestId('empty-state-create-btn').click();

        // 2. Enter exactly 100 characters
        const maxName = 'A'.repeat(100);
        await page.getByTestId('project-name-input').fill(maxName);

        // 3. Verify character counter shows "100/100"
        await expect(page.getByText('100/100')).toBeVisible();

        // 4. Verify Create button is enabled (100 is OK)
        await expect(page.getByTestId('create-project-btn')).not.toBeDisabled();
    });

    test('Persistence: Project Appears in Dashboard', async ({ page }) => {
        // 1. Create a project
        await page.getByTestId('empty-state-create-btn').click();
        await page.getByTestId('project-name-input').fill('Test Persistence');
        await page.getByLabel('Project Number').fill('TEST-001');
        await page.getByTestId('create-project-btn').click();
        await expect(page).toHaveURL(/\/canvas\//);

        // 2. Navigate back to Dashboard (Human-Centric: keyboard shortcut)
        await page.keyboard.press('Control+Shift+D');
        await expect(page).toHaveURL('/dashboard');

        // 3. Verify project appears in grid
        await expect(page.getByText('Test Persistence')).toBeVisible();
        await expect(page.getByText('#TEST-001')).toBeVisible();

        // 4. Click project card to reopen
        await page.getByTestId('project-card').first().click();

        // 5. Verify correct project loads
        await expect(page).toHaveURL(/\/canvas\//);
    });

    test('Keyboard Navigation: Dialog Accessibility', async ({ page }) => {
        // 1. Open dialog
        await page.getByTestId('empty-state-create-btn').click();

        // 2. Verify Project Name field is auto-focused
        await expect(page.getByTestId('project-name-input')).toBeFocused();

        // 3. Tab to next field
        await page.keyboard.press('Tab');
        await expect(page.getByLabel('Project Number')).toBeFocused();

        // 4. Tab to Client Name
        await page.keyboard.press('Tab');
        await expect(page.getByLabel('Client Name')).toBeFocused();

        // 5. Tab to Location
        await page.keyboard.press('Tab');
        await expect(page.getByLabel('Location')).toBeFocused();

        // 6. Press Escape to close dialog
        await page.keyboard.press('Escape');
        await expect(page.getByTestId('new-project-dialog')).not.toBeVisible();
    });
});
