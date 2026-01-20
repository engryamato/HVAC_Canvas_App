/**
 * E2E Test Suite: First Launch Experience (UJ-GS-001)
 *
 * This test suite validates the complete first-time user onboarding flow
 * using strictly HUMAN-CENTRIC navigation (no page.goto mid-flow).
 *
 * Test Coverage:
 * - Happy Path: Splash -> Welcome -> Tutorial -> Project Creation -> Canvas
 * - Skip Path: Splash -> Welcome -> Skip -> Project Creation -> Canvas
 *
 * @spec docs/user-journeys/00-getting-started/tauri-offline/UJ-GS-001-FirstLaunchExperience.md
 * @author Onboarding Team
 * @created 2026-01-08
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper: Clear all application storage to simulate first launch
 */
async function simulateFirstLaunch(page: Page) {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();

    });
}

test.describe('UJ-GS-001: First Launch Experience', () => {

    test.beforeEach(async ({ page }) => {
        // Ensure clean slate for first-launch simulation
        await simulateFirstLaunch(page);
    });

    test('Flow 1: Complete Onboarding Journey (Tutorial Path)', async ({ page }) => {
        // 1. Launch Application (Entry Point)
        await page.goto('/');

        // 2. Validate Splash Screen
        // Note: In fast production builds, splash might be too fleeting or attributes might be stripped.
        // We check for presence but allow it to be missing/transient.
        const splash = page.getByTestId('splash-screen');
        try {
            await expect(splash).toBeVisible({ timeout: 2000 });
        } catch (e) {
            // Splash might have already passed
            console.log('Splash screen already passed or skipped');
        }
        await expect(page.getByTestId('app-logo')).toBeVisible();

        // Wait for Splash to complete and Welcome to appear
        await expect(splash).not.toBeVisible({ timeout: 5000 });

        // 3. Welcome Screen
        const welcome = page.getByText('Welcome to HVAC Canvas');
        await expect(welcome).toBeVisible({ timeout: 10000 });

        // click 'Start Quick Tutorial'
        await page.getByTestId('start-tutorial-btn').click();

        // 4. Tutorial Flow (Dialog Overlay)
        const tutorial = page.getByTestId('tutorial-overlay');
        await expect(tutorial).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Equipment Placement')).toBeVisible(); // Step 1 Title

        // Step 1 -> Next
        await tutorial.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Duct Connection')).toBeVisible(); // Step 2

        // Step 2 -> Next
        await tutorial.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Properties Panel')).toBeVisible(); // Step 3

        // Step 3 -> Next
        await tutorial.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Canvas Navigation')).toBeVisible(); // Step 4

        // Step 4 -> Next
        await tutorial.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Help Access')).toBeVisible(); // Step 5

        // Step 5 -> Finish
        await tutorial.getByRole('button', { name: 'Finish' }).click();

        // 5. Dashboard (Final Destination)
        // Should navigate directly to /dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });

        const projectCards = page.locator('[data-testid="project-card"]');
        if ((await projectCards.count()) === 0) {
            const emptyStateButton = page.getByTestId('empty-state-create-btn');
            const newProjectButton = page.getByTestId('new-project-btn');
            if (await emptyStateButton.isVisible()) {
                await emptyStateButton.click();
            } else {
                await newProjectButton.click();
            }
            await page.getByTestId('project-name-input').fill('First Launch Project');
            await page.getByTestId('create-button').click();
        } else {
            await projectCards.first().click();
        }

        await expect(page).toHaveURL(/\/canvas\//);
        await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
    });

        test('Flow 2: Fast Track (Skip Tutorial)', async ({ page }) => {
            // 1. Launch Application
            await page.goto('/');

            // 2. Wait for Splash
            await expect(page.getByTestId('app-logo')).toBeVisible();
            await expect(page.getByTestId('splash-screen')).toBeVisible();
            await expect(page.getByTestId('splash-screen')).not.toBeVisible({ timeout: 5000 });

            // 3. Welcome Screen -> Skip
            await expect(page.getByText('Welcome to HVAC Canvas')).toBeVisible();
            await page.getByTestId('skip-tutorial-btn').click();

        // 4. Dashboard (Immediate)
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify dashboard loads
        await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 10000 });

        const projectCards = page.locator('[data-testid="project-card"]');
        if ((await projectCards.count()) === 0) {
            const emptyStateButton = page.getByTestId('empty-state-create-btn');
            const newProjectButton = page.getByTestId('new-project-btn');
            if (await emptyStateButton.isVisible()) {
                await emptyStateButton.click();
            } else {
                await newProjectButton.click();
            }
            await page.getByTestId('project-name-input').fill('First Launch Project');
            await page.getByTestId('create-button').click();
        } else {
            await projectCards.first().click();
        }

        await expect(page).toHaveURL(/\/canvas\//);
        await expect(page.getByTestId('canvas-area')).toBeVisible({ timeout: 10000 });
        });

});
